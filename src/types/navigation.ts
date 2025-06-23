import type { Dispatch, SetStateAction } from 'react'

export type CustomListType = 'cardFarmingList' | 'achievementUnlockerList' | 'autoIdleList' | 'favoritesList'
export type PluginPageType = `plugins/${string}`
export type ActivePageType =
  | 'setup'
  | 'games'
  | 'idling'
  | 'freeGames'
  | 'settings'
  | `customlists/${string}`
  | 'tradingCards'
  | PluginPageType
export type CurrentTabType = 'achievements' | 'statistics'
export type CurrentSettingsTabType =
  | 'general'
  | 'card-farming'
  | 'achievement-unlocker'
  | 'logs'
  | 'plugins'
  | `plugin-${string}`

export interface NavigationContextType {
  activePage: ActivePageType
  setActivePage: Dispatch<SetStateAction<ActivePageType>>
  currentTab: CurrentTabType
  setCurrentTab: Dispatch<SetStateAction<CurrentTabType>>
  currentSettingsTab: CurrentSettingsTabType
  setCurrentSettingsTab: Dispatch<SetStateAction<CurrentSettingsTabType>>
}

export interface SidebarItem {
  id: string
  page: ActivePageType
  icon: React.ComponentType<{ fontSize?: number; className?: string }>
  tooltipKey: string
  shouldShow?: boolean
  isActive?: boolean
  customClassName?: string
}
