import type { TimeInputValue } from '@heroui/react'

export interface AchievementUnlockerSettings {
  idle: boolean
  multipleGames: boolean
  hidden: boolean
  nextTaskCheckbox: boolean
  nextTask: string | null
  interval: [number, number]
  schedule: boolean
  scheduleFrom: TimeInputValue
  scheduleTo: TimeInputValue
}

export interface CardFarmingUser {
  avatar: string
  personaName: string
  steamId: string
}

export interface CardFarmingSettings {
  allGames: boolean
  listGames: boolean
  autoFarmCards: boolean
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
  blacklist: number[] | null
  skipNoPlaytime: boolean
  farmUnplayedOnly: boolean
  sortByHighestDrops: boolean
  sortByLowestDrops: boolean
}

export interface GameSpecificSettings {
  maxAchievementUnlocks?: number
  maxCardDrops?: number
  maxCardFarmingTime?: number
  maxIdleTime?: number
}

export interface GameSettings {
  globalMaxIdleTime?: number
  globalMaxCardFarmingTime?: number
  [appId: string]: GameSpecificSettings | number | undefined
}

export interface GeneralSettings {
  antiAway: boolean
  freeGameNotifications: boolean
  apiKey: string | null
  disableTooltips: boolean
  runAtStartup: boolean
  startMinimized: boolean
  closeToTray: boolean
  theme?: string | null
  customBackground?: string | null
  autoRedeemFreeGames: boolean
  autoUpdateGamesList: boolean
  discordPresence: boolean
  showRecommendedCarousel: boolean
  showRecentCarousel: boolean
  showCardDropsCarousel: boolean
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
