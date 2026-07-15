import { useRouter } from 'next/router'
import { useSearchStore } from '@/shared/stores/searchStore'

// Every page that the global search bar/modal can filter registers itself here, keyed by exact
// route pathname. `useActiveSearchScope()` is the single lookup this rewrite uses instead of the
// if/else chains `main` duplicates across `SearchModal.tsx` and `Titlebar.tsx` for the same
// purpose - adding a new searchable page (Step 2: favorites, achievement-unlocker) is just one
// more entry here, no other file needs to branch on the route again.
export type SearchScopeId =
  'games' | 'favorites' | 'achievementUnlocker' | 'autoIdle' | 'cardFarming'

interface SearchScopeConfig {
  id: SearchScopeId
  pathname: string
  labelKey: string
}

const SEARCH_SCOPES: SearchScopeConfig[] = [
  { id: 'games', pathname: '/dashboard', labelKey: 'dashboard.sidebar.nav.games' },
  {
    id: 'favorites',
    pathname: '/dashboard/favorites',
    labelKey: 'dashboard.sidebar.nav.favorites',
  },
  {
    id: 'achievementUnlocker',
    pathname: '/dashboard/achievement-unlocker',
    labelKey: 'dashboard.sidebar.nav.achievementUnlocker',
  },
  {
    id: 'autoIdle',
    pathname: '/dashboard/auto-idle',
    labelKey: 'dashboard.sidebar.nav.autoIdle',
  },
  {
    id: 'cardFarming',
    pathname: '/dashboard/card-farming',
    labelKey: 'dashboard.sidebar.nav.cardFarming',
  },
]

export function useActiveSearchScope() {
  const { pathname } = useRouter()
  // A page with a non-searchable sub-tab (favorites/achievement-unlocker's curated list/queue
  // tab) self-reports here via `setActiveTabSearchable` - this is the one choke point both
  // `GlobalSearchBar` (hide the affordance) and `useGlobalSearchShortcut` (don't open on `/`)
  // already read through, so neither needed a separate tab-awareness check of its own.
  const isActiveTabSearchable = useSearchStore(state => state.isActiveTabSearchable)
  const scope = SEARCH_SCOPES.find(scope => scope.pathname === pathname) ?? null
  return isActiveTabSearchable ? scope : null
}
