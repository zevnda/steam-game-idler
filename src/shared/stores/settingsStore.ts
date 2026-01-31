import type { GlobalSettings, UserSettings } from '@/@types/settings'

import { Time } from '@internationalized/date'

import { create } from 'zustand'

interface Store {
  userSettings: UserSettings
  setUserSettings: (value: UserSettings | ((prevState: UserSettings) => UserSettings)) => void
  globalSettings: GlobalSettings
  setGlobalSettings: (
    value: GlobalSettings | ((prevState: GlobalSettings) => GlobalSettings),
  ) => void
}

export const useSettings = create<Store>(set => ({
  globalSettings: {
    runAtStartup: false,
    startMinimized: false,
    closeToTray: true,
    disableTooltips: false,
    showRecommendedCarousel: true,
    showRecentCarousel: true,
    showCardDropsCarousel: false,
  },
  setGlobalSettings: value =>
    set(state => ({
      globalSettings: typeof value === 'function' ? value(state.globalSettings) : value,
    })),
  userSettings: {
    general: {
      antiAway: false,
      apiKey: null,
    },
    customization: {
      customBackground: null,
      theme: null,
    },
    steamCredentials: {
      credentials: null,
    },
    cardFarming: {
      allGames: true,
      listGames: false,
      nextTaskCheckbox: false,
      nextTask: null,
      skipUnplayedGames: false,
      userSummary: null,
      totalDropsRemaining: 0,
      gamesWithDrops: 0,
      blacklist: null,
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
      sellLimit: {
        min: 0.01,
        max: 10,
      },
      sellDelay: 5,
    },
    gameSettings: null,
  },
  setUserSettings: value =>
    set(state => ({
      userSettings: typeof value === 'function' ? value(state.userSettings) : value,
    })),
}))
