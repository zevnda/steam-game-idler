import type { Achievement, Game, Statistic, TradingCard, UserSettings, UserSummary } from '@/types'

interface Processes {
  appid: number
  name: string
  pid: number
}

export interface InvokeUsers {
  error?: string
  users: UserSummary[]
}

export interface InvokeSettings {
  success: boolean
  settings: UserSettings
}

export interface InvokeIdle {
  error?: string
  success: string
}

export interface InvokeKillProcess {
  success: boolean
  killed_count?: number
}

export interface InvokeRunningProcess {
  processes: Processes[]
}

export interface InvokeUserSummary {
  response: {
    players: {
      steamid: string
      personaname: string
      avatar: string
    }[]
  }
}

export interface InvokeValidateSession {
  user: string | null
}

export interface InvokeValidateKey {
  error?: string
  response?: {
    players?: unknown[]
  }
}

export interface InvokeFreeGames {
  games: Game[]
}

export interface InvokeCustomList {
  error?: string
  list_data: Game[]
}

export interface InvokeGamesList {
  games_list: Game[]
  recent_games: Game[]
}

export interface InvokeAchievementData {
  achievement_data: {
    achievements: Achievement[]
    stats: Statistic[]
  }
}

export interface InvokeAchievementUnlock {
  success: string
}

export interface InvokeStatUpdate {
  success: string
}

export interface InvokeResetStats {
  success: string
}

export interface InvokeDropsRemaining {
  error?: string
  remaining: number
}

export interface InvokeGamesWithDrops {
  error?: string
  gamesWithDrops: Game[]
}

export interface InvokeCardData {
  success: boolean
  card_data: TradingCard[]
}

export interface InvokeCardPrice {
  success: boolean
  price_data: {
    lowest_price: string
    volume: string
    median_price: string
    highest_price: string
    success: boolean
  }
}

export interface InvokeListCards {
  results: {
    assetid: string
    message?: string
    data?: {
      email_domain: string
      needs_email_confirmation: boolean
      needs_mobile_confirmation: boolean
      requires_confirmation: number
      success: boolean
    }
    success: boolean
  }[]
  successful: number
  total: number
}
