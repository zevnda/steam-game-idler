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

export type OrderGraphEntry = [number, number, string]

export interface InvokeCardPrice {
  success: boolean
  sell_order_graph?: OrderGraphEntry[]
  buy_order_graph?: OrderGraphEntry[]
  highest_buy_order?: string
  lowest_sell_order?: string
  buy_order_summary?: string
  sell_order_summary?: string
  error?: string
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

export interface InvokeRemoveListings {
  total_listings: number
  processed_listings: number
  results: {
    listing_id: string
    asset_id: string
    success: boolean
  }[]
  successful_removals: number
}
