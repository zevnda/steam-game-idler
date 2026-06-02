import type { Game, ProDetails, ProTier, UserSettings, UserSummary } from '@/shared/types'
import { Time } from '@internationalized/date'
import { create } from 'zustand'

const DEFAULT_SETTINGS: UserSettings = {
  gameSettings: null,
  general: {
    antiAway: false,
    freeGameNotifications: true,
    apiKey: null,
    disableTooltips: false,
    runAtStartup: false,
    startMinimized: false,
    closeToTray: true,
    customBackground: null,
    autoRedeemFreeGames: false,
    autoUpdateGamesList: false,
    discordPresence: false,
    showRecommendedCarousel: true,
    showRecentCarousel: true,
    showCardDropsCarousel: false,
  },
  cardFarming: {
    listGames: false,
    allGames: true,
    nextTaskCheckbox: false,
    nextTask: null,
    credentials: null,
    userSummary: null,
    gamesWithDrops: 0,
    totalDropsRemaining: 0,
    blacklist: null,
    skipNoPlaytime: false,
    farmUnplayedOnly: false,
    sortByHighestDrops: false,
    sortByLowestDrops: false,
  },
  achievementUnlocker: {
    idle: true,
    hidden: false,
    nextTaskCheckbox: false,
    nextTask: null,
    schedule: false,
    scheduleFrom: new Time(8, 30),
    scheduleTo: new Time(23, 0),
    interval: [30, 130],
  },
  tradingCards: {
    sellOptions: 'highestBuyOrder',
    priceAdjustment: 0.0,
    sellLimit: { min: 0.01, max: 10 },
    sellDelay: 10,
  },
}

interface UserStore {
  userSummary: UserSummary
  gamesList: Game[]
  freeGamesList: Game[]
  userSettings: UserSettings
  isPro: boolean | null
  proTier: ProTier
  proDetails: ProDetails | null
  achievementsUnavailable: boolean
  statisticsUnavailable: boolean

  setUserSummary: (value: UserSummary) => void
  setGamesList: (value: Game[] | ((prev: Game[]) => Game[])) => void
  setFreeGamesList: (value: Game[] | ((prev: Game[]) => Game[])) => void
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void
  setIsPro: (value: boolean | null) => void
  setProTier: (value: ProTier) => void
  setProDetails: (value: ProDetails | null) => void
  setAchievementsUnavailable: (value: boolean) => void
  setStatisticsUnavailable: (value: boolean) => void
  gamesListRefreshKey: number
  incrementGamesListRefreshKey: () => void
}

export const useUserStore = create<UserStore>(set => ({
  userSummary: null,
  gamesList: [],
  freeGamesList: [],
  userSettings: DEFAULT_SETTINGS,
  isPro: null,
  proTier: null,
  proDetails: null,
  achievementsUnavailable: true,
  statisticsUnavailable: true,
  gamesListRefreshKey: 0,

  setUserSummary: value => set({ userSummary: value }),
  setGamesList: value =>
    set(state => ({ gamesList: typeof value === 'function' ? value(state.gamesList) : value })),
  setFreeGamesList: value =>
    set(state => ({
      freeGamesList: typeof value === 'function' ? value(state.freeGamesList) : value,
    })),
  setUserSettings: value =>
    set(state => ({
      userSettings: typeof value === 'function' ? value(state.userSettings) : value,
    })),
  setIsPro: value => set({ isPro: value }),
  setProTier: value => set({ proTier: value }),
  setProDetails: value => set({ proDetails: value }),
  setAchievementsUnavailable: value => set({ achievementsUnavailable: value }),
  setStatisticsUnavailable: value => set({ statisticsUnavailable: value }),
  incrementGamesListRefreshKey: () =>
    set(state => ({ gamesListRefreshKey: state.gamesListRefreshKey + 1 })),
}))
