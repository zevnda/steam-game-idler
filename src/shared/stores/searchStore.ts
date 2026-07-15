import type { SearchScopeId } from '@/shared/search/scopes'
import { create } from 'zustand'

const RECENT_SEARCHES_KEY = 'sgi.search.recentQueries'
const MAX_RECENT_SEARCHES = 10

// Single source of truth for recent-search persistence - unlike `main`'s `searchStore`/
// `SearchModal.tsx`, which each read/write `localStorage` independently (real risk of the two
// drifting), every read and write goes through this one store, nowhere else.
function readRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch (error) {
    console.error('Error reading recent searches:', error)
    return []
  }
}

function writeRecentSearches(queries: string[]) {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(queries))
  } catch (error) {
    console.error('Error persisting recent searches:', error)
  }
}

interface SearchStore {
  // One query per searchable page (`SearchScopeId`) rather than `main`'s hardcoded
  // `gameQueryValue`/`tradingCardQueryValue`/etc. fields - a new searchable page (Step 2) is just a
  // new key here, not a new field plus new branches elsewhere.
  queries: Partial<Record<SearchScopeId, string>>
  setQuery: (scope: SearchScopeId, value: string) => void
  clearQuery: (scope: SearchScopeId) => void
  // Doubles as the global search modal's open flag (null = closed) - one field instead of two that
  // must stay in sync, same idea `settingsModalStore`'s `isOpen`/`activeTab` pair already uses.
  activeScope: SearchScopeId | null
  open: (scope: SearchScopeId) => void
  close: () => void
  // Not derived from the route (unlike `activeScope`/`useActiveSearchScope`, which key off
  // pathname) - favorites/achievement-unlocker's Browse-vs-list/queue tab is local `useState`
  // inside those page components, not a route param, so a page with a non-searchable tab must
  // self-report here on tab change (and reset back to `true` on unmount, so navigating away
  // doesn't leave search hidden on whatever page loads next). Defaults to `true` so every
  // single-tab searchable page (games list) never has to touch this at all.
  isActiveTabSearchable: boolean
  setActiveTabSearchable: (value: boolean) => void
  recentSearches: string[]
  addRecentSearch: (query: string) => void
  removeRecentSearch: (query: string) => void
  clearRecentSearches: () => void
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  queries: {},
  setQuery: (scope, value) => set(state => ({ queries: { ...state.queries, [scope]: value } })),
  clearQuery: scope => set(state => ({ queries: { ...state.queries, [scope]: '' } })),
  activeScope: null,
  open: scope => set({ activeScope: scope }),
  close: () => set({ activeScope: null }),
  isActiveTabSearchable: true,
  setActiveTabSearchable: value => set({ isActiveTabSearchable: value }),
  recentSearches: typeof window !== 'undefined' ? readRecentSearches() : [],
  addRecentSearch: query => {
    const trimmed = query.trim()
    if (!trimmed) return
    const next = [trimmed, ...get().recentSearches.filter(q => q !== trimmed)].slice(
      0,
      MAX_RECENT_SEARCHES,
    )
    writeRecentSearches(next)
    set({ recentSearches: next })
  },
  removeRecentSearch: query => {
    const next = get().recentSearches.filter(q => q !== query)
    writeRecentSearches(next)
    set({ recentSearches: next })
  },
  clearRecentSearches: () => {
    writeRecentSearches([])
    set({ recentSearches: [] })
  },
}))
