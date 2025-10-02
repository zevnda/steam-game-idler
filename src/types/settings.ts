import type { Time } from '@internationalized/date'

export interface AchievementUnlockerSettings {
  hidden: boolean
  idle: boolean
  nextTaskCheckbox: boolean
  nextTask: string | null
  interval: [number, number]
  schedule: boolean
  scheduleFrom: Time
  scheduleTo: Time
}

export interface CardFarmingUser {
  avatar: string
  personaName: string
  steamId: string
}

export interface CardFarmingSettings {
  allGames: boolean
  listGames: boolean
  nextTaskCheckbox: boolean
  nextTask: string | null
  credentials: {
    sid: string
    sls: string
    sma?: string
  } | null
  userSummary: CardFarmingUser | null
  totalDropsRemaining: number
  gamesWithDrops: number
}

export interface GameSpecificSettings {
  maxAchievementUnlocks?: number
  maxCardDrops?: number
  maxIdleTime?: number
}

export interface GameSettings {
  [appId: string]: GameSpecificSettings
}

export interface GeneralSettings {
  antiAway: boolean
  freeGameNotifications: boolean
  apiKey: string | null
  useBeta: boolean
  disableTooltips: boolean
  runAtStartup: boolean
  startMinimized: boolean
}

export interface TradingCardsSettings {
  sellOptions: 'highestBuyOrder' | 'lowestSellOrder'
  priceAdjustment: number
  sellLimit: {
    min: number
    max: number
  }
  sellDelay: number
}

export interface UserSettings {
  general: GeneralSettings
  achievementUnlocker: AchievementUnlockerSettings
  cardFarming: CardFarmingSettings
  gameSettings: GameSettings | null
  tradingCards: TradingCardsSettings
}
