import type { ActivePageType, CurrentSettingsTabType, CurrentTabType, Game } from '@/shared/types'
import { create } from 'zustand'

interface UiStore {
  // Navigation
  activePage: ActivePageType
  previousActivePage: ActivePageType
  currentTab: CurrentTabType
  currentSettingsTab: CurrentSettingsTabType

  // Content visibility
  selectedGame: Game | null
  achievementOrderGame: Game | null
  showSearchModal: boolean
  showSteamWarning: boolean
  proModalOpen: boolean
  proModalRequiredTier: 'casual' | 'gamer' | null

  // Sidebar / layout
  sidebarCollapsed: boolean
  transitionDuration: string

  // Search queries (per context)
  gameQuery: string
  tradingCardQuery: string
  achievementQuery: string
  statisticQuery: string
  customListQuery: string
  recentSearches: string[]

  // Loading states
  loadingUserSummary: boolean

  // Inventory loading states
  loadingItemPrice: Record<string, boolean>
  loadingListButton: boolean
  loadingRemoveListings: boolean

  // Session tracking (games list auto-update)
  gamesListSessionUpdatedSet: Set<string>

  // Actions
  setActivePage: (value: ActivePageType) => void
  setPreviousActivePage: (value: ActivePageType) => void
  setCurrentTab: (value: CurrentTabType) => void
  setCurrentSettingsTab: (value: CurrentSettingsTabType) => void
  setSelectedGame: (value: Game | null) => void
  setAchievementOrderGame: (value: Game | null) => void
  setShowSearchModal: (value: boolean) => void
  setShowSteamWarning: (value: boolean) => void
  setProModalOpen: (value: boolean) => void
  setProModalRequiredTier: (value: 'casual' | 'gamer' | null) => void
  setSidebarCollapsed: (value: boolean) => void
  setTransitionDuration: (value: string) => void
  setGameQuery: (value: string) => void
  setTradingCardQuery: (value: string) => void
  setAchievementQuery: (value: string) => void
  setStatisticQuery: (value: string) => void
  setCustomListQuery: (value: string) => void
  addRecentSearch: (value: string) => void
  removeRecentSearch: (value: string) => void
  clearRecentSearches: () => void
  setLoadingUserSummary: (value: boolean) => void
  setLoadingItemPrice: (
    value: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>),
  ) => void
  setLoadingListButton: (value: boolean) => void
  setLoadingRemoveListings: (value: boolean) => void
  setGamesListSessionUpdated: (steamId: string) => void
}

export const useUiStore = create<UiStore>(set => ({
  activePage: 'games',
  previousActivePage: 'games',
  currentTab: 'achievements',
  currentSettingsTab: 'general',
  selectedGame: null,
  achievementOrderGame: null,
  showSearchModal: false,
  showSteamWarning: false,
  proModalOpen: false,
  proModalRequiredTier: null,
  sidebarCollapsed:
    typeof window !== 'undefined' && localStorage.getItem('sidebarCollapsed') === 'true',
  transitionDuration: '0ms',
  gameQuery: '',
  tradingCardQuery: '',
  achievementQuery: '',
  statisticQuery: '',
  customListQuery: '',
  recentSearches: [],
  loadingUserSummary: true,
  loadingItemPrice: {},
  loadingListButton: false,
  loadingRemoveListings: false,
  gamesListSessionUpdatedSet: new Set(),

  setActivePage: value => set({ activePage: value }),
  setPreviousActivePage: value => set({ previousActivePage: value }),
  setCurrentTab: value => set({ currentTab: value }),
  setCurrentSettingsTab: value => set({ currentSettingsTab: value }),
  setSelectedGame: value => set({ selectedGame: value }),
  setAchievementOrderGame: value => set({ achievementOrderGame: value }),
  setShowSearchModal: value => set({ showSearchModal: value }),
  setShowSteamWarning: value => set({ showSteamWarning: value }),
  setProModalOpen: value => set({ proModalOpen: value }),
  setProModalRequiredTier: value => set({ proModalRequiredTier: value }),
  setSidebarCollapsed: value => set({ sidebarCollapsed: value }),
  setTransitionDuration: value => set({ transitionDuration: value }),
  setGameQuery: value => set({ gameQuery: value }),
  setTradingCardQuery: value => set({ tradingCardQuery: value }),
  setAchievementQuery: value => set({ achievementQuery: value }),
  setStatisticQuery: value => set({ statisticQuery: value }),
  setCustomListQuery: value => set({ customListQuery: value }),
  addRecentSearch: value =>
    set(state => {
      const filtered = state.recentSearches.filter(s => s !== value)
      return { recentSearches: [value, ...filtered].slice(0, 10) }
    }),
  removeRecentSearch: value =>
    set(state => {
      const filtered = state.recentSearches.filter(s => s !== value)
      localStorage.setItem('searchQueries', JSON.stringify(filtered))
      return { recentSearches: filtered }
    }),
  clearRecentSearches: () => set({ recentSearches: [] }),
  setLoadingUserSummary: value => set({ loadingUserSummary: value }),
  setLoadingItemPrice: value =>
    set(state => ({
      loadingItemPrice: typeof value === 'function' ? value(state.loadingItemPrice) : value,
    })),
  setLoadingListButton: value => set({ loadingListButton: value }),
  setLoadingRemoveListings: value => set({ loadingRemoveListings: value }),
  setGamesListSessionUpdated: steamId =>
    set(state => ({
      gamesListSessionUpdatedSet: new Set([...state.gamesListSessionUpdatedSet, steamId]),
    })),
}))
