import type { TranslationKey } from '@/i18n'
import type { AchievementDto } from '../types'

// `percent` (default, see AchievementsTab.tsx) is backfilled for agent mode from a public Web API
// as well as being natively present for CLI/local-mode accounts - see AchievementDto's own doc
// comment. The `?? 0` fallback below only matters for the rare case where that backfill itself
// fails/omits an entry (e.g. a delisted app with no global stats), not a whole-mode gap.
export type AchievementSortStyle =
  'percent' | 'title' | 'unlocked' | 'locked' | 'unprotected' | 'protected'

export const ACHIEVEMENT_SORT_STYLES: AchievementSortStyle[] = [
  'percent',
  'title',
  'unlocked',
  'locked',
  'unprotected',
  'protected',
]

// 'title' reuses the shared common.sort key instead of duplicating the string here.
export const ACHIEVEMENT_SORT_LABEL_KEYS: Record<AchievementSortStyle, TranslationKey> = {
  percent: 'dashboard.achievements.sort.percent',
  title: 'common.sort.nameAsc',
  unlocked: 'dashboard.achievements.sort.unlocked',
  locked: 'dashboard.achievements.sort.locked',
  unprotected: 'dashboard.achievements.sort.unprotected',
  protected: 'dashboard.achievements.sort.protected',
}

export const sortAchievements = (achievements: AchievementDto[], style: AchievementSortStyle) => {
  const sorted = [...achievements]
  switch (style) {
    case 'percent':
      sorted.sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0))
      break
    case 'title':
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'unlocked':
      sorted.sort((a, b) => Number(b.achieved) - Number(a.achieved))
      break
    case 'locked':
      sorted.sort((a, b) => Number(a.achieved) - Number(b.achieved))
      break
    case 'unprotected':
      sorted.sort((a, b) => Number(a.protectedAchievement) - Number(b.protectedAchievement))
      break
    case 'protected':
      sorted.sort((a, b) => Number(b.protectedAchievement) - Number(a.protectedAchievement))
      break
  }
  return sorted
}
