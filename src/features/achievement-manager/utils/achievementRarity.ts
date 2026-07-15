import type { TranslationKey } from '@/i18n'

// Presentational-only "loot rarity" banding over `percent` (global unlock rate, backfilled for
// agent mode too - see AchievementDto's doc comment) for AchievementRow.tsx's rarity pill.
// Thresholds are a rough eyeball of Steam's own community stats page bands, not sourced from any
// external spec - there's no functional meaning here, just a gamer-facing visual cue for how hard
// an achievement is, matching the sort-by-percent option already exposed in sortAchievements.ts.
export type AchievementRarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

const RARITY_THRESHOLDS: [min: number, tier: AchievementRarityTier][] = [
  [50, 'common'],
  [15, 'uncommon'],
  [5, 'rare'],
  [1, 'epic'],
]

export const getAchievementRarityTier = (percent: number) => {
  for (const [min, tier] of RARITY_THRESHOLDS) {
    if (percent >= min) return tier
  }
  return 'legendary'
}

export const RARITY_TIER_LABEL_KEYS: Record<AchievementRarityTier, TranslationKey> = {
  common: 'dashboard.achievements.rarity.common',
  uncommon: 'dashboard.achievements.rarity.uncommon',
  rare: 'dashboard.achievements.rarity.rare',
  epic: 'dashboard.achievements.rarity.epic',
  legendary: 'dashboard.achievements.rarity.legendary',
}

// Raw palette hues (not the theme's single `accent` token) so the five tiers stay visually
// distinct from one another regardless of which hue-shifted theme preset is active - same
// reasoning as TierBadge.tsx's gamer/casual pill colors.
export const RARITY_TIER_CLASSES: Record<AchievementRarityTier, string> = {
  common: 'bg-surface-tertiary text-muted',
  uncommon: 'bg-emerald-500/15 text-emerald-400',
  rare: 'bg-sky-500/15 text-sky-400',
  epic: 'bg-violet-500/15 text-violet-400',
  legendary: 'bg-amber-500/15 text-amber-400',
}
