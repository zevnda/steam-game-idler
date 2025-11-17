import type { ComponentType, Dispatch, SetStateAction } from 'react'

export type CustomListType = 'cardFarmingList' | 'achievementUnlockerList' | 'autoIdleList' | 'favoritesList'
export type ActivePageType =
  | 'setup'
  | 'games'
  | 'idling'
  | 'freeGames'
  | 'settings'
  | `customlists/${string}`
  | 'tradingCards'
  | 'chat'
export type CurrentTabType = 'achievements' | 'statistics'
export type CurrentSettingsTabType =
  | 'general'
  | 'card-farming'
  | 'achievement-unlocker'
  | 'trading-card-manager'
  | 'game-settings'
  | 'debug'

export interface NavigationContextType {
  activePage: ActivePageType
  setActivePage: Dispatch<SetStateAction<ActivePageType>>
  currentTab: CurrentTabType
  setCurrentTab: Dispatch<SetStateAction<CurrentTabType>>
  currentSettingsTab: CurrentSettingsTabType
  setCurrentSettingsTab: Dispatch<SetStateAction<CurrentSettingsTabType>>
  previousActivePage: ActivePageType
  setPreviousActivePage: Dispatch<SetStateAction<ActivePageType>>
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
