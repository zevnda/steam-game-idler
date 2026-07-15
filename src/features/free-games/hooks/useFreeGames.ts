import { useMemo } from 'react'
import { fetchFreeGames } from './useFreeGamesWatcher'
import { useGamesList } from '@/features/games-list/hooks/useGamesList'
import { useFreeGamesStore } from '@/shared/stores/freeGamesStore'

// Thin read hook over `freeGamesStore` - the actual fetch/poll logic lives in
// `useFreeGamesWatcher` (mounted once in `DashboardShell`, see its and the store's own doc
// comments for why), not here. `FreeGamesPage` no longer triggers its own fetch on mount: the
// discovery list is already fetched by the time the dashboard shell has mounted, so navigating to
// this page just reads whatever's already in the store.
export const useFreeGames = () => {
  const { games: ownedGames } = useGamesList()
  const phase = useFreeGamesStore(state => state.phase)
  const freeGames = useFreeGamesStore(state => state.games)
  const isRefreshing = useFreeGamesStore(state => state.isRefreshing)
  const errorCode = useFreeGamesStore(state => state.errorCode)
  const removeGame = useFreeGamesStore(state => state.removeGame)

  // Filters out games this account already owns - the backend's discovery list has no concept of
  // "who's asking", it's the same scraped list for everyone (see discovery.rs's doc comment).
  const ownedAppIds = useMemo(() => new Set(ownedGames.map(game => game.appId)), [ownedGames])
  const unownedFreeGames = useMemo(
    () => freeGames.filter(game => !ownedAppIds.has(game.appId)),
    [freeGames, ownedAppIds],
  )

  return {
    freeGames: unownedFreeGames,
    isLoading: phase === 'loading',
    isRefreshing,
    errorCode,
    refresh: fetchFreeGames,
    // Optimistically drops a just-claimed game from the list without waiting on a full refetch -
    // `useClaimFreeGame` calls this once a claim reports `granted`.
    removeClaimed: removeGame,
  }
}
