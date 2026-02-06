import type { ComponentType } from 'react'

export type CustomListType =
  | 'cardFarmingList'
  | 'achievementUnlockerList'
  | 'autoIdleList'
  | 'favoritesList'
export type ActivePageType =
  | 'setup'
  | 'games'
  | 'idling'
  | 'freeGames'
  | 'settings'
  | `customlists/${string}`
  | 'tradingCards'
export type CurrentTabType = 'achievements' | 'statistics'
export type CurrentSettingsTabType =
  | 'general'
  | 'card-farming'
  | 'achievement-unlocker'
  | 'trading-card-manager'
  | 'free-games'
  | 'steam-credentials'
  | 'game-settings'
  | 'customization'
  | 'debug'

export interface NavigationContextType {
  activePage: ActivePageType
  setActivePage: (value: ActivePageType) => void
  currentTab: CurrentTabType
  setCurrentTab: (value: CurrentTabType) => void
  currentSettingsTab: CurrentSettingsTabType
  setCurrentSettingsTab: (value: CurrentSettingsTabType) => void
  previousActivePage: ActivePageType
  setPreviousActivePage: (value: ActivePageType) => void
}

export interface SidebarItem {
  id: string
  page: ActivePageType
  title: string
  icon: ComponentType<{ fontSize?: number; className?: string }>
  shouldShow?: boolean
  isActive?: boolean
  customClassName?: string
  hasDivider?: boolean
  isBeta?: boolean
  hasUnread?: boolean
}
