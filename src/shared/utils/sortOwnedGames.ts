import type { OwnedGame } from '@/features/games-list/types'
import type { TranslationKey } from '@/i18n'

// Shared by every "all games" browse list that renders a plain `OwnedGame[]` (games list,
// favorites, achievement-unlocker, auto-idle) - all three want the exact same sort styles, so this is one
// comparator set rather than three near-identical copies. Card farming's browse tab has its own
// util (`card-farming/utils/sortGamesWithDrops.ts`) since `GameWithDrops` isn't an `OwnedGame`.
export type OwnedGameSortStyle =
  | 'playtimeDesc'
  | 'playtimeAsc'
  | 'titleAsc'
  | 'titleDesc'
  | 'recentlyPlayedDesc'
  | 'recentlyPlayedAsc'
  | 'achievementsDesc'
  | 'achievementsAsc'

export const OWNED_GAME_SORT_STYLES: OwnedGameSortStyle[] = [
  'playtimeDesc',
  'playtimeAsc',
  'recentlyPlayedDesc',
  'recentlyPlayedAsc',
  'achievementsDesc',
  'achievementsAsc',
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
  achievementsDesc: 'dashboard.games.sort.achievementsDesc',
  achievementsAsc: 'dashboard.games.sort.achievementsAsc',
}

// Styles whose data a CLI-mode account only has with its own Web API key - useOwnedGameSort.ts
// hides these otherwise, see its `useOwnAccountDataSortEligible` for why each one needs it.
const OWN_ACCOUNT_DATA_SORT_STYLES: ReadonlySet<OwnedGameSortStyle> = new Set([
  'recentlyPlayedDesc',
  'recentlyPlayedAsc',
  'achievementsDesc',
  'achievementsAsc',
])

export const requiresOwnAccountData = (style: OwnedGameSortStyle) =>
  OWN_ACCOUNT_DATA_SORT_STYLES.has(style)

// Never-played games (rtimeLastPlayed === 0) sink to the bottom for both directions rather than
// flipping to the top under "oldest first" - a 0 isn't a meaningful timestamp, and surfacing every
// unplayed game before any actually-played one would make the ascending direction useless for its
// intended purpose. Tied at 0, fall back to title so that group has a stable, predictable order
// instead of whatever order the two backends happened to return.
const compareRecentlyPlayed = <T extends OwnedGame>(
  a: T,
  b: T,
  mostRecentFirst: boolean,
  locale: string,
) => {
  if (a.rtimeLastPlayed === 0 && b.rtimeLastPlayed === 0) {
    return (a.name ?? '').localeCompare(b.name ?? '', locale)
  }
  if (a.rtimeLastPlayed === 0) return 1
  if (b.rtimeLastPlayed === 0) return -1
  return mostRecentFirst
    ? b.rtimeLastPlayed - a.rtimeLastPlayed
    : a.rtimeLastPlayed - b.rtimeLastPlayed
}

// Completion ratio, or `null` for a game with nothing to complete - unknown counts (not fetched yet,
// or a CLI-mode private profile) and games with no achievements at all.
const completionRatio = (game: OwnedGame) =>
  game.achievementsTotal && game.achievementsUnlocked !== null
    ? game.achievementsUnlocked / game.achievementsTotal
    : null

// Same "sink to the bottom in both directions" rule as `compareRecentlyPlayed` above, for games
// `completionRatio` can't rank - otherwise "least complete first" would open on a wall of games
// that have no achievements at all, which is exactly what someone using it isn't looking for.
// Equal ratios (most often a run of 100%s or 0%s) put the bigger achievement list first, since
// finishing 500 achievements is the more notable entry than finishing 5.
const compareAchievements = <T extends OwnedGame>(
  a: T,
  b: T,
  mostCompleteFirst: boolean,
  locale: string,
) => {
  const ratioA = completionRatio(a)
  const ratioB = completionRatio(b)
  if (ratioA === null && ratioB === null) {
    return (a.name ?? '').localeCompare(b.name ?? '', locale)
  }
  if (ratioA === null) return 1
  if (ratioB === null) return -1
  if (ratioA !== ratioB) return mostCompleteFirst ? ratioB - ratioA : ratioA - ratioB
  const totalDifference = (b.achievementsTotal ?? 0) - (a.achievementsTotal ?? 0)
  if (totalDifference !== 0) return totalDifference
  return (a.name ?? '').localeCompare(b.name ?? '', locale)
}

// `locale` (the caller's current `i18n.language`) is required, not optional/defaulted - a bare
// `localeCompare()` call falls back to the runtime's own default locale (the OS/browser's, unrelated
// to which language this app is actually displaying), which produces correct-looking-but-wrong
// collation for a title in a script the runtime default doesn't expect (e.g. Chinese-localized game
// names sorted under English collation rules). Threading it explicitly through every call site
// keeps that mismatch from silently creeping back in.
export const sortOwnedGames = <T extends OwnedGame>(
  games: T[],
  style: OwnedGameSortStyle,
  locale: string,
) => {
  const sorted = [...games]
  switch (style) {
    case 'playtimeDesc':
      sorted.sort((a, b) => b.playtimeForeverMinutes - a.playtimeForeverMinutes)
      break
    case 'playtimeAsc':
      sorted.sort((a, b) => a.playtimeForeverMinutes - b.playtimeForeverMinutes)
      break
    case 'titleAsc':
      sorted.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', locale))
      break
    case 'titleDesc':
      sorted.sort((a, b) => (b.name ?? '').localeCompare(a.name ?? '', locale))
      break
    case 'recentlyPlayedDesc':
      sorted.sort((a, b) => compareRecentlyPlayed(a, b, true, locale))
      break
    case 'recentlyPlayedAsc':
      sorted.sort((a, b) => compareRecentlyPlayed(a, b, false, locale))
      break
    case 'achievementsDesc':
      sorted.sort((a, b) => compareAchievements(a, b, true, locale))
      break
    case 'achievementsAsc':
      sorted.sort((a, b) => compareAchievements(a, b, false, locale))
      break
  }
  return sorted
}
