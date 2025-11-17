import type { ActivePageType, CurrentSettingsTabType, CurrentTabType, NavigationContextType } from '@/types'
import type { ReactElement, ReactNode } from 'react'

import { createContext, useContext, useState } from 'react'

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export const NavigationProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [activePage, setActivePage] = useState<ActivePageType>('games')
  const [currentTab, setCurrentTab] = useState<CurrentTabType>('achievements')
  const [currentSettingsTab, setCurrentSettingsTab] = useState<CurrentSettingsTabType>('general')
  const [previousActivePage, setPreviousActivePage] = useState<ActivePageType>('games')

  return (
    <NavigationContext.Provider
      value={{
        activePage,
        setActivePage,
        currentTab,
        setCurrentTab,
        currentSettingsTab,
        setCurrentSettingsTab,
        previousActivePage,
        setPreviousActivePage,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigationContext(): NavigationContextType {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigationContext must be used within a NavigationProvider')
  }
  return context
}
