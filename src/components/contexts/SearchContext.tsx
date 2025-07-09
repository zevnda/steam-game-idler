import type { Dispatch, ReactElement, ReactNode, SetStateAction } from 'react'

import { createContext, useContext, useState } from 'react'

interface SearchContextType {
  isQuery: boolean
  setIsQuery: Dispatch<SetStateAction<boolean>>
  gameQueryValue: string
  setGameQueryValue: Dispatch<SetStateAction<string>>
  tradingCardQueryValue: string
  setTradingCardQueryValue: Dispatch<SetStateAction<string>>
  achievementQueryValue: string
  setAchievementQueryValue: Dispatch<SetStateAction<string>>
  statisticQueryValue: string
  setStatisticQueryValue: Dispatch<SetStateAction<string>>
  recentSearches: string[]
  addRecentSearch: (query: string) => void
  removeRecentSearch: (query: string) => void
  clearRecentSearches: () => void
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined)

export const SearchProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [isQuery, setIsQuery] = useState(false)
  const [gameQueryValue, setGameQueryValue] = useState('')
  const [tradingCardQueryValue, setTradingCardQueryValue] = useState('')
  const [achievementQueryValue, setAchievementQueryValue] = useState('')
  const [statisticQueryValue, setStatisticQueryValue] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const addRecentSearch = (query: string): void => {
    setRecentSearches(prev => {
      const filtered = prev.filter(search => search !== query)
      return [query, ...filtered].slice(0, 10)
    })
  }

  const removeRecentSearch = (query: string): void => {
    setRecentSearches(prev => {
      const filtered = prev.filter(search => search !== query)
      localStorage.setItem('searchQueries', JSON.stringify(filtered))
      return filtered
    })
  }

  const clearRecentSearches = (): void => {
    setRecentSearches([])
  }

  return (
    <SearchContext.Provider
      value={{
        isQuery,
        setIsQuery,
        gameQueryValue,
        setGameQueryValue,
        tradingCardQueryValue,
        setTradingCardQueryValue,
        achievementQueryValue,
        setAchievementQueryValue,
        statisticQueryValue,
        setStatisticQueryValue,
        recentSearches,
        addRecentSearch,
        removeRecentSearch,
        clearRecentSearches,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}

export function useSearchContext(): SearchContextType {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider')
  }
  return context
}
