export type UserSummary = {
  steamId: string
  personaName: string
  avatar: string
  mostRecent?: number
} | null

export type ProTier = 'casual' | 'gamer' | null

export interface ProDetails {
  email: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean | null
  status: string | null
}

export interface CardFarmingUser {
  avatar: string
  personaName: string
  steamId: string
}
