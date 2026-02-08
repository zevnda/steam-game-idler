import { create } from 'zustand'

interface SearchStore {
  isQuery: boolean
  setIsQuery: (value: boolean | ((prev: boolean) => boolean)) => void
  gameQueryValue: string
  setGameQueryValue: (value: string | ((prev: string) => string)) => void
  tradingCardQueryValue: string
  setTradingCardQueryValue: (value: string | ((prev: string) => string)) => void
  achievementQueryValue: string
  setAchievementQueryValue: (value: string | ((prev: string) => string)) => void
  statisticQueryValue: string
  setStatisticQueryValue: (value: string | ((prev: string) => string)) => void
  recentSearches: string[]
  addRecentSearch: (value: string) => void
  removeRecentSearch: (value: string) => void
  clearRecentSearches: () => void
}

export const useSearchStore = create<SearchStore>(set => ({
  isQuery: false,
  setIsQuery: value =>
    set(state => ({
      isQuery: typeof value === 'function' ? value(state.isQuery) : value,
    })),
  gameQueryValue: '',
  setGameQueryValue: value =>
    set(state => ({
      gameQueryValue: typeof value === 'function' ? value(state.gameQueryValue) : value,
    })),
  tradingCardQueryValue: '',
  setTradingCardQueryValue: value =>
    set(state => ({
      tradingCardQueryValue:
        typeof value === 'function' ? value(state.tradingCardQueryValue) : value,
    })),
  achievementQueryValue: '',
  setAchievementQueryValue: value =>
    set(state => ({
      achievementQueryValue:
        typeof value === 'function' ? value(state.achievementQueryValue) : value,
    })),
  statisticQueryValue: '',
  setStatisticQueryValue: value =>
    set(state => ({
      statisticQueryValue: typeof value === 'function' ? value(state.statisticQueryValue) : value,
    })),
  recentSearches: [],
  addRecentSearch: value =>
    set(state => {
      const filtered = state.recentSearches.filter(search => search !== value)
      return { recentSearches: [value, ...filtered].slice(0, 10) }
    }),
  removeRecentSearch: value =>
    set(state => {
      const filtered = state.recentSearches.filter(search => search !== value)
      localStorage.setItem('searchQueries', JSON.stringify(filtered))
      return { recentSearches: filtered }
    }),
  clearRecentSearches: () => set({ recentSearches: [] }),
}))
