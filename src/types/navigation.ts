import type { Dispatch, SetStateAction } from 'react'

export type CustomListType = 'cardFarmingList' | 'achievementUnlockerList' | 'autoIdleList' | 'favoritesList'
export type ActivePageType = 'setup' | 'games' | 'idling' | 'freeGames' | 'settings' | `customlists/${string}`
export type CurrentTabType = 'achievements' | 'statistics'
export type CurrentSettingsTabType = 'general' | 'card-farming' | 'achievement-unlocker' | 'logs'

export interface NavigationContextType {
  activePage: ActivePageType
  setActivePage: Dispatch<SetStateAction<ActivePageType>>
  currentTab: CurrentTabType
  setCurrentTab: Dispatch<SetStateAction<CurrentTabType>>
  currentSettingsTab: CurrentSettingsTabType
  setCurrentSettingsTab: Dispatch<SetStateAction<CurrentSettingsTabType>>
}
