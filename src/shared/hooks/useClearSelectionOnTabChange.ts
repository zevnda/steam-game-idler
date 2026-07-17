import { useEffect } from 'react'
import { useGameSelectionStore } from '@/shared/stores/gameSelectionStore'

// A multi-select made on one tab's card set (e.g. Favorites' "Browse" grid) shouldn't silently
// keep applying once the user switches to a different tab (e.g. "List") on the same page - the two
// tabs render different card sets from different arrays, so a stale selection could reference an
// appId that isn't even part of the newly-active tab's `orderedGames`. Route/account changes are
// handled separately by `useClearSelectionOnNavigation.ts` (mounted once in `DashboardShell`); this
// one is mounted per-page next to that page's own tab state.
export const useClearSelectionOnTabChange = (activeTab: string) => {
  useEffect(() => {
    useGameSelectionStore.getState().clear()
  }, [activeTab])
}
