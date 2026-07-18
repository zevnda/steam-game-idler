import type { OwnedGameSortStyle } from '@/shared/utils/sortOwnedGames'
import { useMemo } from 'react'
import { useAutoUpdateGamesListStore } from '@/shared/stores/autoUpdateGamesListStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { isRecentlyPlayedSortStyle, OWNED_GAME_SORT_STYLES } from '@/shared/utils/sortOwnedGames'

const FALLBACK_STYLE: OwnedGameSortStyle = 'playtimeDesc'

// "Recently played" sort needs `rtime_last_played`, which the CLI-mode backend can only source
// from the Steam Web API's `GetOwnedGames` - and Valve only returns that specific field when the
// key used belongs to the queried account itself (see `games::web_api::fetch_owned_games`'s doc
// comment). Every CLI-mode account riding the app's shared embedded key gets `rtime_last_played:
// 0` back for every game, which silently degrades the sort to alphabetical order (see
// `sortOwnedGames.ts`'s `compareRecentlyPlayed`) rather than erroring - easy to mistake for a bug
// report instead of a missing key. Agent mode is unaffected: its `rtime_last_played` comes from
// SteamKit2's own authenticated CM session (`OwnershipManager.cs`), never the public Web API, so
// it isn't subject to this restriction regardless of which key the app is using elsewhere.
export const useRecentlyPlayedSortEligible = () => {
  const account = useSessionStore(state => state.account)
  const hasCustomApiKey = useAutoUpdateGamesListStore(state => state.hasCustomApiKey)
  return account?.mode === 'agent' || hasCustomApiKey
}

// Hides (not disables - a visible-but-unclickable option here would just invite "why can't I
// click this?" support questions) the two recently-played styles once the active account can't
// produce meaningful data for them, and substitutes a safe fallback for `style` if it's currently
// one of the hidden ones - e.g. right after switching to an ineligible account - so a
// `GameSortSelect`'s controlled `value` never points at an option that isn't in its `options`
// list, and `sortOwnedGames` never silently no-ops on a hidden style. `style` itself (the
// persisted `sortPreferencesStore` value) is left untouched so the user's real choice comes back
// once they're eligible again, e.g. switching back to an agent-mode account.
export const useOwnedGameSort = (style: OwnedGameSortStyle) => {
  const eligible = useRecentlyPlayedSortEligible()

  return useMemo(() => {
    const options = eligible
      ? OWNED_GAME_SORT_STYLES
      : OWNED_GAME_SORT_STYLES.filter(candidate => !isRecentlyPlayedSortStyle(candidate))
    const effectiveStyle = !eligible && isRecentlyPlayedSortStyle(style) ? FALLBACK_STYLE : style

    return { options, effectiveStyle }
  }, [eligible, style])
}
