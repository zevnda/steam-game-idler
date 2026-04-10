export type ProTier = 'casual' | 'gamer' | null

// Subscribers before this date get full Gamer access regardless of their plan_id
export const GRANDFATHER_CUTOFF = new Date('2026-04-10')

// Ad-free experience, exclusive themes, Discord role
export function hasCasualFeature(tier: ProTier) {
  return tier === 'casual' || tier === 'gamer'
}

// Automated Steam credentials, auto games list updates, free game redemption, sell dupes
export function hasGamerFeature(tier: ProTier) {
  return tier === 'gamer'
}
