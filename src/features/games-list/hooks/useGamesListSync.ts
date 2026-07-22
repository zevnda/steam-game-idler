import type { SignedInAccount } from '@/shared/stores/sessionStore'
import type { OwnedGame } from '../types'
import { useEffect } from 'react'
import { useGamesListStore } from '@/shared/stores/gamesListStore'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { invoke } from '@/shared/utils/invoke'

// Mirrors `games::mod::OwnedGamesResult` (src-tauri/src/games/mod.rs) - `get_owned_games`'s return
// shape, carrying `possiblyPrivate` alongside the games list itself since both come from the same
// fetch (see that struct's doc comment).
interface OwnedGamesResult {
  games: OwnedGame[]
  possiblyPrivate: boolean
}

// How long a cached games list is trusted before a background refresh kicks in automatically on
// the next app/session start. Deliberately the same for both sign-in modes, not just a CLI-mode
// throttle: `games::commands::get_owned_games` (src-tauri/src/games/commands.rs) calls the Steam
// Web API's `GetOwnedGames` for playtime enrichment in *both* modes today, and the API key behind
// it is a single one embedded in every release build, shared across every install (see
// `embedded_api_key.rs`) - so agent mode isn't actually safer to auto-refresh aggressively than CLI
// mode is, until/unless a later step makes that call conditional per mode. Keep this simple for
// now (a flat staleness window plus the existing manual refresh button) - a future PRO tier may
// want more aggressive auto-refresh, but that's explicitly out of scope here.
const STALE_AFTER_MS = 5 * 60 * 1000

// Fetches a fresh owned-games list and writes it to `gamesListStore`'s entry for `account`, via
// `updateEntry` so a stale in-flight fetch for a since-replaced active account can't clobber the
// current one's denormalized view (it still lands in `entries[key]` either way). Exported (not
// just used internally by `useGamesListSync`) so `useGamesList` can drive the same manual-refresh
// button behavior both `GamesPage` and `IdlingPage` already had.
//
// `showLoadingState` drives `phase` back to `'loading'` for the duration of the fetch - both
// consuming pages already key their full skeleton off `phase === 'loading'` (see
// `GamesPage.tsx`/`IdlingPage.tsx`), so this is what a caller outside either page (e.g.
// `useAgentOwnershipSettings`'s scope toggle) uses to make an otherwise-silent refetch visibly
// obvious, without needing its own local "manual refreshing" state the way each page's own refresh
// button does.
export async function fetchGamesList(
  account: SignedInAccount,
  options?: { showLoadingState?: boolean },
) {
  const key = getAccountKey(account)
  const { updateEntry } = useGamesListStore.getState()
  updateEntry(key, {
    isRefreshing: true,
    errorCode: null,
    ...(options?.showLoadingState ? { phase: 'loading' } : {}),
  })

  try {
    const fresh = await invoke<OwnedGamesResult>('get_owned_games', { account })
    updateEntry(key, {
      games: fresh.games,
      possiblyPrivate: fresh.possiblyPrivate,
      phase: 'ready',
      lastFetchedAt: Date.now(),
      isRefreshing: false,
    })
  } catch (error) {
    console.error('Error in (get_owned_games):', error)
    updateEntry(key, { errorCode: String(error), phase: 'ready', isRefreshing: false })
  }
}

// Refreshes `account`'s entry in the background without ever touching `isRefreshing`/`phase` -
// unlike `fetchGamesList` above, this must not flash `GamesPageHeader`'s refresh-button spinner
// (driven by `isRefreshing`) or the page skeleton (driven by `phase`, see `GamesPage.tsx`) on every
// tick. Used exclusively by `useAutoUpdateGamesListStatus`'s interval - errors are logged, not
// surfaced to `errorCode`, since a silent background poll failing shouldn't replace whatever load/
// manual-refresh error state is already showing.
export async function silentlyRefreshGamesList(account: SignedInAccount) {
  const key = getAccountKey(account)
  try {
    const fresh = await invoke<OwnedGamesResult>('get_owned_games', { account })
    useGamesListStore.getState().updateEntry(key, {
      games: fresh.games,
      possiblyPrivate: fresh.possiblyPrivate,
      lastFetchedAt: Date.now(),
    })
  } catch (error) {
    console.error('Error in (get_owned_games) for silent auto-update:', error)
  }
}

// Keeps `gamesListStore` in sync with the backend regardless of which /dashboard/* route is active
// - mounted once from `DashboardShell` (not from either page that reads the store), matching
// `useIdlingSync`'s reasoning exactly: this is what lets a fetched games list survive navigating
// away from /dashboard and back instead of refetching on every mount.
export const useGamesListSync = () => {
  const account = useSessionStore(state => state.account)

  useEffect(() => {
    if (!account) return
    const key = getAccountKey(account)
    const { entries, setActiveAccount } = useGamesListStore.getState()
    const existingEntry = entries[key]

    setActiveAccount(key)

    if (!existingEntry) {
      // First time this account's been made active this session - no cached entry to show yet.
      // Local-mode accounts already have a resolved SteamID64 from sign-in, so they can paint from
      // `get_owned_games_cache` immediately. Agent-mode accounts have no SteamID64 on the frontend
      // at all - the backend only resolves one from the live daemon session, internally, inside
      // `get_owned_games` itself - so there's no key to read a cache by until that call resolves
      // and caches one as a side effect; agent-mode accounts always start from `loading` instead.
      if (account.mode === 'local') {
        invoke<OwnedGame[]>('get_owned_games_cache', { steamId: account.steamId })
          .then(cached => {
            if (cached.length > 0 && useGamesListStore.getState().accountKey === key) {
              useGamesListStore.getState().updateEntry(key, { games: cached, phase: 'ready' })
            }
          })
          .catch(error => {
            console.error('Error in (get_owned_games_cache):', error)
          })
      }

      fetchGamesList(account)
      return
    }

    // Already have a cached entry for this account (from a prior fetch this session, e.g. after
    // switching back from another account) - only auto-refresh if it's gone stale, since this
    // effect only re-runs when `account` itself changes, not on every navigation back to a page
    // that reads this store (that's the whole point - see the module doc comment).
    if (
      existingEntry.lastFetchedAt !== null &&
      Date.now() - existingEntry.lastFetchedAt < STALE_AFTER_MS
    ) {
      return
    }
    fetchGamesList(account)
  }, [account])
}
