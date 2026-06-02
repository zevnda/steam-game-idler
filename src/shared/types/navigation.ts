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
  | 'inventoryManager'

export type CurrentTabType = 'achievements' | 'statistics'

export type CurrentSettingsTabType =
  | 'general'
  | 'subscription'
  | 'card-farming'
  | 'achievement-unlocker'
  | 'inventory-manager'
  | 'free-games'
  | 'steam-credentials'
  | 'game-settings'
  | 'customization'
  | 'keybinds'
  | 'debug'

export interface SidebarItem {
  id: string
  page: ActivePageType
  title: string
  icon: ComponentType<{ fontSize?: number; className?: string }>
  isActive?: boolean
  customClassName?: string
  isBeta?: boolean
}
