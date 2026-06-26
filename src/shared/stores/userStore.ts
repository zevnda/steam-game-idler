import type { Game, UserSettings, UserSummary } from '@/shared/types'
import { Time } from '@internationalized/date'
import { create } from 'zustand'

export interface SubscriptionDetails {
  email: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean | null
  status: string | null
  paymentProvider: string | null
}

interface UserStore {
  userSummary: UserSummary
  setUserSummary: (value: UserSummary | ((prev: UserSummary) => UserSummary)) => void
  achievementsUnavailable: boolean
  setAchievementsUnavailable: (value: boolean | ((prev: boolean) => boolean)) => void
  statisticsUnavailable: boolean
  setStatisticsUnavailable: (value: boolean | ((prev: boolean) => boolean)) => void
  gamesList: Game[]
  setGamesList: (value: Game[] | ((prev: Game[]) => Game[])) => void
  freeGamesList: Game[]
  setFreeGamesList: (value: Game[] | ((prev: Game[]) => Game[])) => void
  isSubscribed: boolean | null
  setIsSubscribed: (value: boolean | null | ((prev: boolean | null) => boolean | null)) => void
  subscriptionTier: 'casual' | 'gamer' | null
  setSubscriptionTier: (
    value:
      | 'casual'
      | 'gamer'
      | null
      | ((prev: 'casual' | 'gamer' | null) => 'casual' | 'gamer' | null),
  ) => void
  subscriptionDetails: SubscriptionDetails | null
  setSubscriptionDetails: (value: SubscriptionDetails | null) => void
  userSettings: UserSettings
  setUserSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void
}

export const useUserStore = create<UserStore>(set => ({
  userSummary: null,
  setUserSummary: value =>
    set(state => ({
      userSummary: typeof value === 'function' ? value(state.userSummary) : value,
    })),
  achievementsUnavailable: true,
  setAchievementsUnavailable: value =>
    set(state => ({
      achievementsUnavailable:
        typeof value === 'function' ? value(state.achievementsUnavailable) : value,
    })),
  statisticsUnavailable: true,
  setStatisticsUnavailable: value =>
    set(state => ({
      statisticsUnavailable:
        typeof value === 'function' ? value(state.statisticsUnavailable) : value,
    })),
  gamesList: [],
  setGamesList: value =>
    set(state => ({
      gamesList: typeof value === 'function' ? value(state.gamesList) : value,
    })),
  freeGamesList: [],
  setFreeGamesList: value =>
    set(state => ({
      freeGamesList: typeof value === 'function' ? value(state.freeGamesList) : value,
    })),
  isSubscribed: null,
  setIsSubscribed: value =>
    set(state => ({
      isSubscribed: typeof value === 'function' ? value(state.isSubscribed) : value,
    })),
  subscriptionTier: null,
  setSubscriptionTier: value =>
    set(state => ({
      subscriptionTier: typeof value === 'function' ? value(state.subscriptionTier) : value,
    })),
  subscriptionDetails: null,
  setSubscriptionDetails: value => set({ subscriptionDetails: value }),
  userSettings: {
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
      autoFarmCards: false,
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
      multipleGames: false,
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
      sellLimit: {
        min: 0.01,
        max: 10,
      },
      sellDelay: 10,
    },
  },
  setUserSettings: value =>
    set(state => ({
      userSettings: typeof value === 'function' ? value(state.userSettings) : value,
    })),
}))
