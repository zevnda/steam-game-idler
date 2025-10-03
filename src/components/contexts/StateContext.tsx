import type { Dispatch, ReactElement, ReactNode, SetStateAction } from 'react'

import { createContext, useContext, useState } from 'react'

interface StateContextType {
  sidebarCollapsed: boolean
  setSidebarCollapsed: Dispatch<SetStateAction<boolean>>
  appId: number | null
  setAppId: Dispatch<SetStateAction<number | null>>
  appName: string | null
  setAppName: Dispatch<SetStateAction<string | null>>
  showFreeGamesTab: boolean
  setShowFreeGamesTab: Dispatch<SetStateAction<boolean>>
  showAchievements: boolean
  setShowAchievements: Dispatch<SetStateAction<boolean>>
  isCardFarming: boolean
  setIsCardFarming: Dispatch<SetStateAction<boolean>>
  isAchievementUnlocker: boolean
  setIsAchievementUnlocker: Dispatch<SetStateAction<boolean>>
  showSteamWarning: boolean
  setShowSteamWarning: Dispatch<SetStateAction<boolean>>
  loadingItemPrice: Record<string, boolean>
  setLoadingItemPrice: Dispatch<SetStateAction<Record<string, boolean>>>
  loadingListButton: boolean
  setLoadingListButton: Dispatch<SetStateAction<boolean>>
  loadingRemoveListings: boolean
  setLoadingRemoveListings: Dispatch<SetStateAction<boolean>>
  useBeta: boolean
  setUseBeta: Dispatch<SetStateAction<boolean>>
  transitionDuration: string
  setTransitionDuration: Dispatch<SetStateAction<string>>
}

export const StateContext = createContext<StateContextType | undefined>(undefined)

export const StateProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [appId, setAppId] = useState<number | null>(null)
  const [appName, setAppName] = useState<string | null>(null)
  const [showFreeGamesTab, setShowFreeGamesTab] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [isCardFarming, setIsCardFarming] = useState(false)
  const [isAchievementUnlocker, setIsAchievementUnlocker] = useState(false)
  const [showSteamWarning, setShowSteamWarning] = useState(false)
  const [loadingItemPrice, setLoadingItemPrice] = useState<Record<string, boolean>>({})
  const [loadingListButton, setLoadingListButton] = useState(false)
  const [loadingRemoveListings, setLoadingRemoveListings] = useState(false)
  const [useBeta, setUseBeta] = useState(false)
  const [transitionDuration, setTransitionDuration] = useState('0ms')

  return (
    <StateContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        showFreeGamesTab,
        setShowFreeGamesTab,
        appId,
        setAppId,
        appName,
        setAppName,
        showAchievements,
        setShowAchievements,
        isCardFarming,
        setIsCardFarming,
        isAchievementUnlocker,
        setIsAchievementUnlocker,
        showSteamWarning,
        setShowSteamWarning,
        loadingItemPrice,
        setLoadingItemPrice,
        loadingListButton,
        setLoadingListButton,
        loadingRemoveListings,
        setLoadingRemoveListings,
        useBeta,
        setUseBeta,
        transitionDuration,
        setTransitionDuration,
      }}
    >
      {children}
    </StateContext.Provider>
  )
}

export function useStateContext(): StateContextType {
  const context = useContext(StateContext)
  if (context === undefined) {
    throw new Error('useStateContext must be used within a StateProvider')
  }
  return context
}
