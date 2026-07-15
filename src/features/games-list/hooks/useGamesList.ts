import { useCallback, useState } from 'react'
import { fetchGamesList } from './useGamesListSync'
import { useGamesListStore } from '@/shared/stores/gamesListStore'
import { useSessionStore } from '@/shared/stores/sessionStore'

// Thin read/action hook over `gamesListStore` - the actual fetch/cache-first logic lives in
// `useGamesListSync` (mounted once in `DashboardShell`, see its doc comment for why), not here.
// Kept as its own hook, rather than reading the store directly from `GamesPage`/`IdlingPage`, so
// both call sites share one `refresh` action and don't need to know the store's account-scoping
// details themselves.
//
// `isManualRefreshing` is deliberately local state, not read off `gamesListStore` - the store's own
// `isRefreshing` flips true for every `fetchGamesList` call (a first-time fetch, an account-switch
// staleness refresh, AND a manual refresh alike), which is correct for the header button's own
// pending spinner but wrong for deciding whether to show the full page skeleton: only a refresh
// this specific component instance actually triggered should replace the page content with a
// skeleton again - an account-switch-triggered background refresh must stay silent (see
// `useGamesListSync`'s doc comment), and `IdlingPage` (the other consumer of this hook) has its own
// separate instance, so its own "Try Again" button doesn't cross-trigger GamesPage's skeleton.
export const useGamesList = () => {
  const account = useSessionStore(state => state.account)
  const phase = useGamesListStore(state => state.phase)
  const games = useGamesListStore(state => state.games)
  const isRefreshing = useGamesListStore(state => state.isRefreshing)
  const errorCode = useGamesListStore(state => state.errorCode)
  const possiblyPrivate = useGamesListStore(state => state.possiblyPrivate)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    if (!account) return
    setIsManualRefreshing(true)
    try {
      await fetchGamesList(account)
    } finally {
      setIsManualRefreshing(false)
    }
  }, [account])

  return { phase, games, isRefreshing, isManualRefreshing, errorCode, possiblyPrivate, refresh }
}
