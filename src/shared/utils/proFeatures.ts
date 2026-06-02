import type { ProTier } from '@/shared/types'

export function hasCasualFeature(tier: ProTier) {
  return tier === 'casual' || tier === 'gamer'
}

export function hasGamerFeature(tier: ProTier) {
  return tier === 'gamer'
}
