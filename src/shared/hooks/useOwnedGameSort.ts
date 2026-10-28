import type { OwnedGameSortStyle } from '@/shared/utils/sortOwnedGames'
import { useMemo } from 'react'
import { useAutoUpdateGamesListStore } from '@/shared/stores/autoUpdateGamesListStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { OWNED_GAME_SORT_STYLES, requiresOwnAccountData } from '@/shared/utils/sortOwnedGames'

const FALLBACK_STYLE: OwnedGameSortStyle = 'playtimeDesc'

// Agent mode, or a CLI-mode account with a user-supplied Web API key - the only cases where the
// `requiresOwnAccountData` sort styles have real data behind them. Agent mode gets everything over
// SteamKit2's own authenticated CM session, never the public Web API, so it's always eligible.
// For CLI mode, on the app's shared embedded key:
// - "Recently played" needs `rtime_last_played`, which Valve only returns from `GetOwnedGames`
//   when the key belongs to the queried account itself (see `games::web_api::fetch_owned_games`'s
//   doc comment) - otherwise it's `0` for every game and the sort silently degrades to
//   alphabetical (see `sortOwnedGames.ts`'s `compareRecentlyPlayed`).
// - "Achievement completion" counts are deliberately never fetched at all - a full library
//   refresh costs one call per 200 games, too much for a quota pooled across every install (see
//   `games::achievement_progress`'s module doc comment) - so every game would rank as "unknown".
export const useOwnAccountDataSortEligible = () => {
  const account = useSessionStore(state => state.account)
  const hasCustomApiKey = useAutoUpdateGamesListStore(state => state.hasCustomApiKey)
  return account?.mode === 'agent' || hasCustomApiKey
}

// Hides (not disables - a visible-but-unclickable option here would just invite "why can't I
// click this?" support questions) the `requiresOwnAccountData` styles once the active account
// can't produce meaningful data for them, and substitutes a safe fallback for `style` if it's
// currently one of the hidden ones - e.g. right after switching to an ineligible account - so a
// `GameSortSelect`'s controlled `value` never points at an option that isn't in its `options`
// list, and `sortOwnedGames` never silently no-ops on a hidden style. `style` itself (the
// persisted `sortPreferencesStore` value) is left untouched so the user's real choice comes back
// once they're eligible again, e.g. switching back to an agent-mode account.
export const useOwnedGameSort = (style: OwnedGameSortStyle) => {
  const eligible = useOwnAccountDataSortEligible()

  return useMemo(() => {
    const options = eligible
      ? OWNED_GAME_SORT_STYLES
      : OWNED_GAME_SORT_STYLES.filter(candidate => !requiresOwnAccountData(candidate))
    const effectiveStyle = !eligible && requiresOwnAccountData(style) ? FALLBACK_STYLE : style

    return { options, effectiveStyle }
  }, [eligible, style])
}
