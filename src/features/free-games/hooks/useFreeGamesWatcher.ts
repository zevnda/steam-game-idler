import type { Settings } from '@/features/settings/types'
import type { TFunction } from 'i18next'
import type { FreeGameClaimOutcome, FreeGameEntry, FreeGamesSettings } from '../types'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@heroui/react'
import { fetchGamesList } from '@/features/games-list/hooks/useGamesListSync'
import { useFreeGameNotificationsStore } from '@/shared/stores/freeGameNotificationsStore'
import { useFreeGamesStore } from '@/shared/stores/freeGamesStore'
import { useGamesListStore } from '@/shared/stores/gamesListStore'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { invoke } from '@/shared/utils/invoke'
import { sendNativeNotification } from '@/shared/utils/nativeNotification'
import { hasGamerAccess } from '@/shared/utils/subscriptionAccess'

// Manual-refresh action for `FreeGamesPage`'s own refresh button - reuses the exact same
// `get_free_games` call the watcher's poll below makes, writing into the same `freeGamesStore` so
// both paths stay a single source of truth. Mirrors `fetchGamesList`'s export pattern
// (useGamesListSync.ts) for the same reason: a page-driven manual action and a background sync
// hook both need to trigger the identical fetch/store-write.
export async function fetchFreeGames() {
  const { setLoading, setGames, setError } = useFreeGamesStore.getState()
  setLoading()
  try {
    setGames(await invoke<FreeGameEntry[]>('get_free_games'))
  } catch (error) {
    console.error('Error in (get_free_games):', error)
    setError(String(error))
  }
}

const POLL_INTERVAL_MS = 60 * 60 * 1000
const SEEN_APP_IDS_STORAGE_KEY = 'sgi.freeGames.seenAppIds'

// Discovery has no account concept (see discovery.rs's doc comment), so "seen before" is tracked
// app-wide in localStorage, not per-account - mirrors `main`'s own `freeGamesIds` key
// (handleCheckForFreeGames.ts). Not the same list `useFreeGames.ts`'s page hook keeps in its own
// state: that hook fetches fresh on every page visit for the page's own loading/error UI, while
// this is a long-lived diff against whatever was last seen, for a purpose (notify/auto-redeem
// once) the page hook doesn't need.
function readSeenAppIds() {
  try {
    const raw = localStorage.getItem(SEEN_APP_IDS_STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set()
  } catch (error) {
    console.error('Error reading seen free-game app ids:', error)
    return new Set()
  }
}

function writeSeenAppIds(appIds: Iterable<number>) {
  try {
    localStorage.setItem(SEEN_APP_IDS_STORAGE_KEY, JSON.stringify(Array.from(appIds)))
  } catch (error) {
    console.error('Error persisting seen free-game app ids:', error)
  }
}

// Attempts every currently-discovered free game for every signed-in account with gamer access (a
// global, device-wide check, not per-account) and its own `autoRedeem` setting on. Deliberately
// NOT limited to newly-discovered games (see the poll loop's own doc comment on why) - this must
// keep retrying on every poll for as long as a game stays live on the discovery list and a given
// account doesn't yet own it, regardless of whether the user was already notified about it.
//
// Pre-filters against each account's own cached owned-games list (`gamesListStore`'s per-account
// `entries`) when one is available, skipping a game that account already owns. Not required for
// correctness - `claim_free_game`'s own outcome already reports `alreadyOwned` for agent mode - but
// it avoids re-running CLI mode's hidden-webview store-page claim, and its documented, ambiguous
// `failed` outcome for an already-owned game (see `FreeGameClaimOutcome`'s doc comment), on every
// single hourly poll forever. Falls back to attempting the claim directly when this account has no
// cached entry yet (e.g. a background agent-mode account never made active this session) - agent
// mode's own `alreadyOwned` outcome handles that case safely with no ambiguity, and CLI mode is
// single-account-only so its sole possible account always has a cached entry the moment it's
// signed in (see `useGamesListSync`).
async function autoRedeemForSignedInAccounts(games: FreeGameEntry[], t: TFunction) {
  if (games.length === 0) return
  if (!hasGamerAccess(useSubscriptionStore.getState().subscriptionTier)) return

  const { entries } = useGamesListStore.getState()
  const accounts = Object.values(useSessionStore.getState().accounts)
  for (const account of accounts) {
    let settings: FreeGamesSettings
    try {
      settings = await invoke<FreeGamesSettings>('get_free_games_settings', { account })
    } catch (error) {
      console.error('Error in (get_free_games_settings) during auto-redeem:', error)
      continue
    }
    if (!settings.autoRedeem) continue

    const ownedGames = entries[getAccountKey(account)]?.games
    const claimableGames = ownedGames
      ? games.filter(game => !ownedGames.some(owned => owned.appId === game.appId))
      : games

    let grantedAny = false
    for (const game of claimableGames) {
      try {
        const outcome = await invoke<FreeGameClaimOutcome>('claim_free_game', {
          account,
          appId: game.appId,
        })
        if (outcome.outcome === 'granted') {
          toast.success(t('dashboard.freeGames.autoRedeem.success', { name: game.name }))
          // Same optimistic removal `useClaimFreeGame`'s manual claim path does - drops it from
          // the Free Games tab immediately rather than waiting on the owned-games refresh below
          // (or, if this account isn't the active one, waiting on nothing at all).
          useFreeGamesStore.getState().removeGame(game.appId)
          grantedAny = true
        } else if (outcome.outcome === 'failed') {
          toast.danger(t('dashboard.freeGames.autoRedeem.failure', { name: game.name }))
        }
        // 'alreadyOwned' - nothing actionable happened, no toast needed.
      } catch (error) {
        console.error('Error in (claim_free_game) during auto-redeem:', error)
      }
    }

    // One refresh per account, after every game this poll granted it - not one per claim, since
    // `get_owned_games` is a full re-fetch (playtime enrichment over the account's whole library,
    // potentially thousands of games) that claiming 3 games back-to-back has no reason to trigger
    // 3 times.
    if (grantedAny) {
      fetchGamesList(account)
    }
  }
}

// Mounted once in DashboardShell (never unmounted within /dashboard/*), independent of whether the
// Free Games page is open - this is also what makes `freeGamesStore` already populated by the time
// anyone navigates to that page, instead of the page fetching for itself on every visit (see
// `freeGamesStore`'s own doc comment). Hydrates `freeGameNotificationsStore` from the real
// persisted app-wide setting once (mirrors `useAntiAwayStatus`'s identical hydration effect), then
// - once the active account's owned-games list has finished its first load (see the polling effect
// below) - immediately and on an hourly interval thereafter (matching `main`'s own polling cadence)
// fetches the discovery list into `freeGamesStore`. Diffs it against whatever was last seen to send
// a native OS notification (if enabled) for anything new, and separately attempts auto-redeem
// against the full discovery list (not just what's new - see `autoRedeemForSignedInAccounts`'s own
// doc comment) for every signed-in, gamer-tier, opted-in account. Only the very first fetch flips
// `freeGamesStore.phase` to 'ready' - every subsequent hourly poll writes through
// `setGamesSilently` instead, so a scheduled re-poll can never re-trigger the page's initial
// loading skeleton, mirroring `silentlyRefreshGamesList`'s identical restraint.
export const useFreeGamesWatcher = () => {
  const { t } = useTranslation()
  const setNotificationsEnabled = useFreeGameNotificationsStore(state => state.setEnabled)

  useEffect(() => {
    invoke<Settings>('get_settings')
      .then(settings => setNotificationsEnabled(settings.freeGameNotifications))
      .catch(error => {
        console.error('Error in (get_settings) for free-game-notifications hydration:', error)
      })
    // Intentionally runs once per mount, not per `setNotificationsEnabled` identity change - a
    // one-time hydration from disk, same reasoning as useAntiAwayStatus's identical effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false
    let interval: ReturnType<typeof setInterval> | null = null

    const poll = async () => {
      const store = useFreeGamesStore.getState()
      const isInitialFetch = store.phase === 'loading'
      let games: FreeGameEntry[]
      try {
        games = await invoke<FreeGameEntry[]>('get_free_games')
      } catch (error) {
        console.error('Error in (get_free_games) during watcher poll:', error)
        if (isInitialFetch) store.setError(String(error))
        return
      }

      if (isInitialFetch) {
        store.setGames(games)
      } else {
        store.setGamesSilently(games)
      }

      // `seen` only tracks "has the user already been told about this" - it must stay scoped to
      // the notification below, not to auto-redeem further down. Auto-redeem needs to keep trying
      // on every poll regardless of whether a game was already seen (e.g. auto-redeem got turned
      // on after the game was first discovered, or an earlier claim attempt didn't go through) -
      // gating it on this same diff used to mean a game already marked "seen" silently never got
      // another auto-redeem attempt again, with no error or log to explain why.
      const seen = readSeenAppIds()
      const newGames = games.filter(game => !seen.has(game.appId))
      // Persisted regardless of whether anything is new, so a game that later rotates out of the
      // discovery list and back in isn't treated as new again.
      writeSeenAppIds(games.map(game => game.appId))

      if (newGames.length > 0 && useFreeGameNotificationsStore.getState().enabled) {
        // Filtered against the active account's owned-games cache (same source `useFreeGames.ts`
        // filters the page grid with) so a game the user already owns doesn't trigger an OS
        // notification just because the app-wide discovery scrape has no ownership concept. Safe
        // to read directly (not gated here) because the effect below never starts polling until
        // that cache has finished its first load.
        const ownedAppIds = new Set(useGamesListStore.getState().games.map(game => game.appId))
        const notifiableGames = newGames.filter(game => !ownedAppIds.has(game.appId))
        if (notifiableGames.length > 0) {
          const body =
            notifiableGames.length === 1
              ? t('dashboard.freeGames.notifications.bodyOne', { name: notifiableGames[0].name })
              : t('dashboard.freeGames.notifications.bodyMany', { count: notifiableGames.length })
          sendNativeNotification(t('dashboard.freeGames.notifications.title'), body)
        }
      }

      // Always run against the full discovery list, not just `newGames` - see this function's own
      // doc comment for why auto-redeem must not be gated by the notification-dedup `seen` list.
      await autoRedeemForSignedInAccounts(games, t)
    }

    const startPolling = () => {
      if (cancelled) return
      poll()
      interval = setInterval(poll, POLL_INTERVAL_MS)
    }

    // The owned-games fetch (`useGamesListSync`) and this discovery fetch both kick off around app
    // start, but the discovery scrape has historically resolved first - polling immediately used to
    // read `useGamesListStore.getState().games` while it was still empty, so a game the user
    // already owned looked "unowned" for that first check: a false native notification, plus a
    // gold sidebar icon (`useFreeGames.ts`'s `unownedFreeGames`) until the owned list caught up and
    // silently corrected it. Wait for that first load to finish before ever checking free games at
    // all, so ownership is known-accurate on the very first check instead of racing it.
    // `gamesListStore.phase` only reverts to 'loading' again on a mid-session switch to an
    // account with no cached entry yet (see `useGamesListSync`) - narrow enough that letting the
    // next hourly poll pick up the correct ownership is an acceptable trade-off there, rather than
    // re-gating every single poll on it.
    if (useGamesListStore.getState().phase === 'ready') {
      startPolling()
    } else {
      const unsubscribe = useGamesListStore.subscribe(state => {
        if (state.phase !== 'ready') return
        unsubscribe()
        startPolling()
      })
      return () => {
        cancelled = true
        unsubscribe()
        if (interval) clearInterval(interval)
      }
    }

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [t])
}
