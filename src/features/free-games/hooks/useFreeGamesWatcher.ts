import type { Settings } from '@/features/settings/types'
import type { TFunction } from 'i18next'
import type { FreeGameClaimOutcome, FreeGameEntry, FreeGamesSettings } from '../types'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@heroui/react'
import { useFreeGameNotificationsStore } from '@/shared/stores/freeGameNotificationsStore'
import { useFreeGamesStore } from '@/shared/stores/freeGamesStore'
import { useGamesListStore } from '@/shared/stores/gamesListStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
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

// Attempts `newGames` for every currently signed-in account with gamer access (a global,
// device-wide check, not per-account) and its own `autoRedeem` setting on.
// Doesn't pre-filter by ownership - `claim_free_game`'s own outcome already reports `alreadyOwned`
// (agent mode) or a documented, accepted `failed` (CLI mode), so there's no
// need for a second ownership fetch per account before attempting a claim.
async function autoRedeemForSignedInAccounts(newGames: FreeGameEntry[], t: TFunction) {
  if (!hasGamerAccess(useSubscriptionStore.getState().subscriptionTier)) return

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

    for (const game of newGames) {
      try {
        const outcome = await invoke<FreeGameClaimOutcome>('claim_free_game', {
          account,
          appId: game.appId,
        })
        if (outcome.outcome === 'granted') {
          toast.success(t('dashboard.freeGames.autoRedeem.success', { name: game.name }))
        } else if (outcome.outcome === 'failed') {
          toast.danger(t('dashboard.freeGames.autoRedeem.failure', { name: game.name }))
        }
        // 'alreadyOwned' - nothing actionable happened, no toast needed.
      } catch (error) {
        console.error('Error in (claim_free_game) during auto-redeem:', error)
      }
    }
  }
}

// Mounted once in DashboardShell (never unmounted within /dashboard/*), independent of whether the
// Free Games page is open - this is also what makes `freeGamesStore` already populated by the time
// anyone navigates to that page, instead of the page fetching for itself on every visit (see
// `freeGamesStore`'s own doc comment). Hydrates `freeGameNotificationsStore` from the real
// persisted app-wide setting once (mirrors `useAntiAwayStatus`'s identical hydration effect), then
// immediately and on an hourly interval thereafter (matching `main`'s own polling cadence) fetches
// the discovery list into `freeGamesStore`, diffs it against whatever was last seen, and for
// anything new: sends a native OS notification (if enabled) and attempts auto-redeem for every
// signed-in, gamer-tier, opted-in account. Only the very first fetch (mount) flips
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

      const seen = readSeenAppIds()
      const newGames = games.filter(game => !seen.has(game.appId))
      // Persisted regardless of whether anything is new, so a game that later rotates out of the
      // discovery list and back in isn't treated as new again.
      writeSeenAppIds(games.map(game => game.appId))

      if (newGames.length === 0) return

      if (useFreeGameNotificationsStore.getState().enabled) {
        // Filtered against the active account's owned-games cache (same source `useFreeGames.ts`
        // filters the page grid with) so a game the user already owns doesn't trigger an OS
        // notification just because the app-wide discovery scrape has no ownership concept.
        // Doesn't gate `autoRedeemForSignedInAccounts` below - that loop covers every signed-in
        // account, not just the active one, and already tolerates `alreadyOwned` per-account
        // without a pre-filter (see that function's own doc comment).
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

      await autoRedeemForSignedInAccounts(newGames, t)
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [t])
}
