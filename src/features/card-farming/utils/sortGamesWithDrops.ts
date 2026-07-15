import type { TranslationKey } from '@/i18n'
import type { GameWithDrops } from '../types'

// Card farming's "Games With Drops" browse tab isn't `OwnedGame[]`-shaped (see GameWithDrops's own
// doc comment - it carries `remaining`/`playtimeHours` instead), so it can't reuse
// `shared/utils/sortOwnedGames.ts` - this mirrors that util's shape/switch structure with drops
// added as the two extra styles. Defaults to `dropsDesc` (see CardFarmingPage.tsx) since remaining
// drops is the one piece of information this tab exists to surface.
export type CardFarmingSortStyle =
  'dropsDesc' | 'dropsAsc' | 'playtimeDesc' | 'playtimeAsc' | 'titleAsc' | 'titleDesc'

export const CARD_FARMING_SORT_STYLES: CardFarmingSortStyle[] = [
  'dropsDesc',
  'dropsAsc',
  'playtimeDesc',
  'playtimeAsc',
  'titleAsc',
  'titleDesc',
]

// Reuses `dashboard.games.sort.*` for playtime (identical English text) and the shared common.sort
// keys for title; only the two drops-specific styles get
// their own key (see en-US.json's `dashboard.cardFarming.sort`).
export const CARD_FARMING_SORT_LABEL_KEYS: Record<CardFarmingSortStyle, TranslationKey> = {
  dropsDesc: 'dashboard.cardFarming.sort.dropsDesc',
  dropsAsc: 'dashboard.cardFarming.sort.dropsAsc',
  playtimeDesc: 'dashboard.games.sort.playtimeDesc',
  playtimeAsc: 'dashboard.games.sort.playtimeAsc',
  titleAsc: 'common.sort.nameAsc',
  titleDesc: 'common.sort.nameDesc',
}

export const sortGamesWithDrops = (games: GameWithDrops[], style: CardFarmingSortStyle) => {
  const sorted = [...games]
  switch (style) {
    case 'dropsDesc':
      sorted.sort((a, b) => b.remaining - a.remaining)
      break
    case 'dropsAsc':
      sorted.sort((a, b) => a.remaining - b.remaining)
      break
    case 'playtimeDesc':
      sorted.sort((a, b) => b.playtimeHours - a.playtimeHours)
      break
    case 'playtimeAsc':
      sorted.sort((a, b) => a.playtimeHours - b.playtimeHours)
      break
    case 'titleAsc':
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'titleDesc':
      sorted.sort((a, b) => b.name.localeCompare(a.name))
      break
  }
  return sorted
}
