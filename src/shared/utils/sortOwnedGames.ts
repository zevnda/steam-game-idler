import type { OwnedGame } from '@/features/games-list/types'
import type { TranslationKey } from '@/i18n'

// Shared by every "all games" browse list that renders a plain `OwnedGame[]` (games list,
// achievement-unlocker, auto-idle) - all three want the exact same four sort styles, so this is one
// comparator set rather than three near-identical copies. Card farming's browse tab has its own
// util (`card-farming/utils/sortGamesWithDrops.ts`) since `GameWithDrops` isn't an `OwnedGame`.
export type OwnedGameSortStyle = 'playtimeDesc' | 'playtimeAsc' | 'titleAsc' | 'titleDesc'

export const OWNED_GAME_SORT_STYLES: OwnedGameSortStyle[] = [
  'playtimeDesc',
  'playtimeAsc',
  'titleAsc',
  'titleDesc',
]

// 'titleAsc'/'titleDesc' reuse the shared common.sort keys instead of duplicating the string here.
export const OWNED_GAME_SORT_LABEL_KEYS: Record<OwnedGameSortStyle, TranslationKey> = {
  playtimeDesc: 'dashboard.games.sort.playtimeDesc',
  playtimeAsc: 'dashboard.games.sort.playtimeAsc',
  titleAsc: 'common.sort.nameAsc',
  titleDesc: 'common.sort.nameDesc',
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
  }
  return sorted
}
