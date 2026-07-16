import type { FavoriteEntry } from '../types'
import { useCallback, useEffect, useState } from 'react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { onGameListChange } from '@/shared/utils/gameListsBus'
import { invoke } from '@/shared/utils/invoke'

// Unlike games-list/idling, favorites has no `DashboardShell`-mounted sync hook or shared store.
// Those exist because their data drifts *externally* - idling's background poller/daemon push
// events, games-list's playtime accruing behind a staleness window - independent of whatever page
// is currently open. A favorite only ever changes because of a click inside this feature's own
// UI, so a page-scoped fetch-on-mount is sufficient; refetching on remount is cheap (a local file
// read, not a network call), so there's no benefit to persisting it across navigation the way
// idling/games-list must.
export const useFavorites = () => {
  const account = useSessionStore(state => state.account)
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [pendingAppIds, setPendingAppIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!account) {
      setFavorites([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setErrorCode(null)

    invoke<FavoriteEntry[]>('get_favorites', { account })
      .then(result => {
        if (!cancelled) setFavorites(result)
      })
      .catch(error => {
        if (!cancelled) {
          console.error('Error in (get_favorites):', error)
          setErrorCode(String(error))
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [account])

  // The game-card context menu (useContextMenu.ts) can add a favorite from outside this page's own
  // UI, bypassing addFavorite below - subscribe so this instance's list stays correct without
  // needing a remount. See gameListsBus.ts's own doc comment.
  useEffect(() => onGameListChange('favorites', setFavorites), [])

  const addFavorite = useCallback(
    async (game: FavoriteEntry) => {
      if (!account) return
      try {
        setFavorites(await invoke<FavoriteEntry[]>('add_favorite', { account, game }))
      } catch (error) {
        console.error('Error in (add_favorite):', error)
        setErrorCode(String(error))
      }
    },
    [account],
  )

  const removeFavorite = useCallback(
    async (appId: number) => {
      if (!account) return
      setPendingAppIds(prev => new Set(prev).add(appId))
      try {
        setFavorites(await invoke<FavoriteEntry[]>('remove_favorite', { account, appId }))
      } catch (error) {
        console.error('Error in (remove_favorite):', error)
        setErrorCode(String(error))
      } finally {
        setPendingAppIds(prev => {
          const next = new Set(prev)
          next.delete(appId)
          return next
        })
      }
    },
    [account],
  )

  const reorder = useCallback(
    async (newOrder: FavoriteEntry[]) => {
      if (!account) return
      // Optimistic: reflect the reordered list immediately (drag-and-drop feels laggy otherwise),
      // then persist - reverting is not attempted on failure since a reorder has no "correct"
      // previous state worth restoring over what the user just dragged to.
      setFavorites(newOrder)
      try {
        await invoke<FavoriteEntry[]>('set_favorites_order', { account, favorites: newOrder })
      } catch (error) {
        console.error('Error in (set_favorites_order):', error)
        setErrorCode(String(error))
      }
    },
    [account],
  )

  // Convenience wrapper for the "All Games" tab's single heart button - tracks its own per-game
  // pending state so a card disables itself while its own request is in flight (the only race
  // worth guarding on the frontend; the backend's file lock already serializes the actual writes).
  const toggleFavorite = useCallback(
    async (appId: number, name: string) => {
      setPendingAppIds(prev => new Set(prev).add(appId))
      try {
        const isFavorited = favorites.some(f => f.appId === appId)
        if (isFavorited) {
          await removeFavorite(appId)
        } else {
          await addFavorite({ appId, name })
        }
      } finally {
        setPendingAppIds(prev => {
          const next = new Set(prev)
          next.delete(appId)
          return next
        })
      }
    },
    [favorites, addFavorite, removeFavorite],
  )

  return {
    favorites,
    isLoading,
    errorCode,
    pendingAppIds,
    addFavorite,
    removeFavorite,
    reorder,
    toggleFavorite,
  }
}
