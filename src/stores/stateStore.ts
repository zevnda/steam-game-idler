import { create } from 'zustand'

interface StateStore {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void
  appId: number | null
  setAppId: (value: number | null | ((prev: number | null) => number | null)) => void
  appName: string | null
  setAppName: (value: string | null | ((prev: string | null) => string | null)) => void
  showAchievements: boolean
  setShowAchievements: (value: boolean | ((prev: boolean) => boolean)) => void
  isCardFarming: boolean
  setIsCardFarming: (value: boolean | ((prev: boolean) => boolean)) => void
  isAchievementUnlocker: boolean
  setIsAchievementUnlocker: (value: boolean | ((prev: boolean) => boolean)) => void
  showSteamWarning: boolean
  setShowSteamWarning: (value: boolean | ((prev: boolean) => boolean)) => void
  loadingItemPrice: Record<string, boolean>
  setLoadingItemPrice: (
    value: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>),
  ) => void
  loadingListButton: boolean
  setLoadingListButton: (value: boolean | ((prev: boolean) => boolean)) => void
  loadingRemoveListings: boolean
  setLoadingRemoveListings: (value: boolean | ((prev: boolean) => boolean)) => void
  useBeta: boolean
  setUseBeta: (value: boolean | ((prev: boolean) => boolean)) => void
  transitionDuration: string
  setTransitionDuration: (value: string | ((prev: string) => string)) => void
  loadingUserSummary: boolean
  setLoadingUserSummary: (value: boolean | ((prev: boolean) => boolean)) => void
}

export const useStateStore = create<StateStore>(set => ({
  sidebarCollapsed: typeof window !== 'undefined' && localStorage.getItem('sidebarCollapsed') === 'true',
  setSidebarCollapsed: value =>
    set(state => ({
      sidebarCollapsed: typeof value === 'function' ? value(state.sidebarCollapsed) : value,
    })),
  appId: null,
  setAppId: value =>
    set(state => ({
      appId: typeof value === 'function' ? value(state.appId) : value,
    })),
  appName: null,
  setAppName: value =>
    set(state => ({
      appName: typeof value === 'function' ? value(state.appName) : value,
    })),
  showAchievements: false,
  setShowAchievements: value =>
    set(state => ({
      showAchievements: typeof value === 'function' ? value(state.showAchievements) : value,
    })),
  isCardFarming: false,
  setIsCardFarming: value =>
    set(state => ({
      isCardFarming: typeof value === 'function' ? value(state.isCardFarming) : value,
    })),
  isAchievementUnlocker: false,
  setIsAchievementUnlocker: value =>
    set(state => ({
      isAchievementUnlocker: typeof value === 'function' ? value(state.isAchievementUnlocker) : value,
    })),
  showSteamWarning: false,
  setShowSteamWarning: value =>
    set(state => ({
      showSteamWarning: typeof value === 'function' ? value(state.showSteamWarning) : value,
    })),
  loadingItemPrice: {},
  setLoadingItemPrice: value =>
    set(state => ({
      loadingItemPrice: typeof value === 'function' ? value(state.loadingItemPrice) : value,
    })),
  loadingListButton: false,
  setLoadingListButton: value =>
    set(state => ({
      loadingListButton: typeof value === 'function' ? value(state.loadingListButton) : value,
    })),
  loadingRemoveListings: false,
  setLoadingRemoveListings: value =>
    set(state => ({
      loadingRemoveListings: typeof value === 'function' ? value(state.loadingRemoveListings) : value,
    })),
  useBeta: false,
  setUseBeta: value =>
    set(state => ({
      useBeta: typeof value === 'function' ? value(state.useBeta) : value,
    })),
  transitionDuration: '0ms',
  setTransitionDuration: value =>
    set(state => ({
      transitionDuration: typeof value === 'function' ? value(state.transitionDuration) : value,
    })),
  loadingUserSummary: true,
  setLoadingUserSummary: value =>
    set(state => ({
      loadingUserSummary: typeof value === 'function' ? value(state.loadingUserSummary) : value,
    })),
}))
