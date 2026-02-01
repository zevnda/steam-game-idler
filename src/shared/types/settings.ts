import type { TimeInputValue } from '@heroui/react'
import type { UserSummary } from './user'

export interface UserSettings {
  general: GeneralSettings
  achievementUnlocker: AchievementUnlockerSettings
  cardFarming: CardFarmingSettings
  gameSettings: GameSettings | null
  tradingCards: TradingCardsSettings
}

export interface GlobalSettings {
  runAtStartup: boolean
  startMinimized: boolean
  closeToTray: boolean
  disableTooltips: boolean
  showRecommendedCarousel: boolean
  showRecentCarousel: boolean
  showCardDropsCarousel: boolean
}

export interface GeneralSettings {
  antiAway: boolean
  apiKey: string | null
}

export interface CustomizationSettings {
  customBackground?: string | null
  theme?: string | null
}

export interface SteamCredentials {
  credentials: {
    sessionid: string
    steamLoginSecure: string
    steamMachineAuth?: string
  } | null
}

export interface CardFarmingSettings {
  allGames: boolean
  listGames: boolean
  nextTaskCheckbox: boolean
  nextTask: string | null
  skipUnplayedGames: boolean
  userSummary: UserSummary | null
  totalDropsRemaining: number
  gamesWithDrops: number
  blacklist: number[] | null
}

export interface AchievementUnlockerSettings {
  idle: boolean
  hidden: boolean
  nextTaskCheckbox: boolean
  nextTask: string | null
  schedule: boolean
  scheduleFrom: TimeInputValue
  scheduleTo: TimeInputValue
  interval: [number, number]
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

export interface FreeGameSettings {
  freeGameNotifications: boolean
  autoRedeemFreeGames: boolean
}

export interface GameSettings {
  globalMaxIdleTime?: number
  [appId: string]: GameSpecificSettings | number | undefined
}

export interface GameSpecificSettings {
  maxAchievementUnlocks?: number
  maxCardDrops?: number
  maxIdleTime?: number
}
