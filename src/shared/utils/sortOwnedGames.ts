import type { OwnedGame } from '@/features/games-list/types'
import type { TranslationKey } from '@/i18n'

// Shared by every "all games" browse list that renders a plain `OwnedGame[]` (games list,
// achievement-unlocker, auto-idle) - all three want the exact same sort styles, so this is one
// comparator set rather than three near-identical copies. Card farming's browse tab has its own
// util (`card-farming/utils/sortGamesWithDrops.ts`) since `GameWithDrops` isn't an `OwnedGame`.
export type OwnedGameSortStyle =
  | 'playtimeDesc'
  | 'playtimeAsc'
  | 'titleAsc'
  | 'titleDesc'
  | 'recentlyPlayedDesc'
  | 'recentlyPlayedAsc'

export const OWNED_GAME_SORT_STYLES: OwnedGameSortStyle[] = [
  'playtimeDesc',
  'playtimeAsc',
  'recentlyPlayedDesc',
  'recentlyPlayedAsc',
  'titleAsc',
  'titleDesc',
]

// 'titleAsc'/'titleDesc' reuse the shared common.sort keys instead of duplicating the string here.
export const OWNED_GAME_SORT_LABEL_KEYS: Record<OwnedGameSortStyle, TranslationKey> = {
  playtimeDesc: 'dashboard.games.sort.playtimeDesc',
  playtimeAsc: 'dashboard.games.sort.playtimeAsc',
  titleAsc: 'common.sort.nameAsc',
  titleDesc: 'common.sort.nameDesc',
  recentlyPlayedDesc: 'dashboard.games.sort.recentlyPlayedDesc',
  recentlyPlayedAsc: 'dashboard.games.sort.recentlyPlayedAsc',
}

// Never-played games (rtimeLastPlayed === 0) sink to the bottom for both directions rather than
// flipping to the top under "oldest first" - a 0 isn't a meaningful timestamp, and surfacing every
// unplayed game before any actually-played one would make the ascending direction useless for its
// intended purpose. Tied at 0, fall back to title so that group has a stable, predictable order
// instead of whatever order the two backends happened to return.
const compareRecentlyPlayed = <T extends OwnedGame>(a: T, b: T, mostRecentFirst: boolean) => {
  if (a.rtimeLastPlayed === 0 && b.rtimeLastPlayed === 0) {
    return (a.name ?? '').localeCompare(b.name ?? '')
  }
  if (a.rtimeLastPlayed === 0) return 1
  if (b.rtimeLastPlayed === 0) return -1
  return mostRecentFirst
    ? b.rtimeLastPlayed - a.rtimeLastPlayed
    : a.rtimeLastPlayed - b.rtimeLastPlayed
}

export const sortOwnedGames = <T extends OwnedGame>(games: T[], style: OwnedGameSortStyle) => {
  const sorted = [...games]
  switch (style) {
    case 'playtimeDesc':
      sorted.sort((a, b) => b.playtimeForeverMinutes - a.playtimeForeverMinutes)
      break
    case 'playtimeAsc':
      sorted.sort((a, b) => a.playtimeForeverMinutes - b.playtimeForeverMinutes)
      break
    case 'titleAsc':
      sorted.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
      break
    case 'titleDesc':
      sorted.sort((a, b) => (b.name ?? '').localeCompare(a.name ?? ''))
      break
    case 'recentlyPlayedDesc':
      sorted.sort((a, b) => compareRecentlyPlayed(a, b, true))
      break
    case 'recentlyPlayedAsc':
      sorted.sort((a, b) => compareRecentlyPlayed(a, b, false))
      break
  }
  return sorted
}
