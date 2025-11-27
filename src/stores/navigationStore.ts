import type { ActivePageType, CurrentSettingsTabType, CurrentTabType } from '@/types'

import { create } from 'zustand'

interface NavigationStore {
  activePage: ActivePageType
  setActivePage: (value: ActivePageType | ((prev: ActivePageType) => ActivePageType)) => void
  currentTab: CurrentTabType
  setCurrentTab: (value: CurrentTabType | ((prev: CurrentTabType) => CurrentTabType)) => void
  currentSettingsTab: CurrentSettingsTabType
  setCurrentSettingsTab: (
    value: CurrentSettingsTabType | ((prev: CurrentSettingsTabType) => CurrentSettingsTabType),
  ) => void
  previousActivePage: ActivePageType
  setPreviousActivePage: (value: ActivePageType | ((prev: ActivePageType) => ActivePageType)) => void
}

export const useNavigationStore = create<NavigationStore>(set => ({
  activePage: 'games',
  setActivePage: value =>
    set(state => ({
      activePage: typeof value === 'function' ? value(state.activePage) : value,
    })),
  currentTab: 'achievements',
  setCurrentTab: value =>
    set(state => ({
      currentTab: typeof value === 'function' ? value(state.currentTab) : value,
    })),
  currentSettingsTab: 'general',
  setCurrentSettingsTab: value =>
    set(state => ({
      currentSettingsTab: typeof value === 'function' ? value(state.currentSettingsTab) : value,
    })),
  previousActivePage: 'games',
  setPreviousActivePage: value =>
    set(state => ({
      previousActivePage: typeof value === 'function' ? value(state.previousActivePage) : value,
    })),
}))
