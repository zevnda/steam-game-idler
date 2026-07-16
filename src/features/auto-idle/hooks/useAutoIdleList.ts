import type { IdleSetResult } from '@/features/idling/types'
import type { AutoIdleEntry } from '../types'
import { useCallback, useEffect, useState } from 'react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { onGameListChange } from '@/shared/utils/gameListsBus'
import { invoke } from '@/shared/utils/invoke'

// Mirrors src/features/favorites/hooks/useFavorites.ts almost exactly - a page-scoped
// fetch-on-mount, no `DashboardShell` sync hook, since this list only changes via clicks inside
// this feature's own UI (same reasoning favorites' own hook already documents). The one addition
// is `setEnabled` (a per-entry flag this list has that favorites doesn't) and `startNow` (the
// manual "Start Now" trigger - the startup-on-launch trigger itself is a separate hook,
// `useAutoIdleStartup`, mounted in `DashboardShell` instead of here).
export const useAutoIdleList = () => {
  const account = useSessionStore(state => state.account)
  const [games, setGames] = useState<AutoIdleEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [pendingAppIds, setPendingAppIds] = useState<Set<number>>(new Set())
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    if (!account) {
      setGames([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setErrorCode(null)

    invoke<AutoIdleEntry[]>('get_auto_idle_list', { account })
      .then(result => {
        if (!cancelled) setGames(result)
      })
      .catch(error => {
        if (!cancelled) {
          console.error('Error in (get_auto_idle_list):', error)
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

  // The game-card context menu (useContextMenu.ts) can add to this list from outside this page's
  // own UI, bypassing addGame below - subscribe so this instance's list stays correct without
  // needing a remount. See gameListsBus.ts's own doc comment.
  useEffect(() => onGameListChange('autoIdleList', setGames), [])

  const addGame = useCallback(
    async (game: AutoIdleEntry) => {
      if (!account) return
      try {
        setGames(await invoke<AutoIdleEntry[]>('add_to_auto_idle_list', { account, game }))
      } catch (error) {
        console.error('Error in (add_to_auto_idle_list):', error)
        setErrorCode(String(error))
      }
    },
    [account],
  )

  const removeGame = useCallback(
    async (appId: number) => {
      if (!account) return
      setPendingAppIds(prev => new Set(prev).add(appId))
      try {
        setGames(await invoke<AutoIdleEntry[]>('remove_from_auto_idle_list', { account, appId }))
      } catch (error) {
        console.error('Error in (remove_from_auto_idle_list):', error)
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
    async (newOrder: AutoIdleEntry[]) => {
      if (!account) return
      // Optimistic, same reasoning useFavorites.ts's `reorder` documents - a reorder has no
      // "correct" previous state worth restoring on failure.
      setGames(newOrder)
      try {
        await invoke<AutoIdleEntry[]>('set_auto_idle_list_order', { account, games: newOrder })
      } catch (error) {
        console.error('Error in (set_auto_idle_list_order):', error)
        setErrorCode(String(error))
      }
    },
    [account],
  )

  const setEnabled = useCallback(
    async (appId: number, enabled: boolean) => {
      if (!account) return
      setPendingAppIds(prev => new Set(prev).add(appId))
      try {
        setGames(
          await invoke<AutoIdleEntry[]>('set_auto_idle_enabled', { account, appId, enabled }),
        )
      } catch (error) {
        console.error('Error in (set_auto_idle_enabled):', error)
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

  // Convenience wrapper for the "All Games" tab's single toggle button - add/remove queue
  // membership, mirroring useFavorites.ts's `toggleFavorite`. Newly-added games default to
  // `enabled: true`, matching `main`'s "newly added games are on by default" behavior.
  const toggleQueued = useCallback(
    async (appId: number, name: string) => {
      setPendingAppIds(prev => new Set(prev).add(appId))
      try {
        const isQueued = games.some(g => g.appId === appId)
        if (isQueued) {
          await removeGame(appId)
        } else {
          await addGame({ appId, name, enabled: true })
        }
      } finally {
        setPendingAppIds(prev => {
          const next = new Set(prev)
          next.delete(appId)
          return next
        })
      }
    },
    [games, addGame, removeGame],
  )

  const startNow = useCallback(async () => {
    if (!account) return null
    setIsStarting(true)
    setErrorCode(null)
    try {
      return await invoke<IdleSetResult>('start_auto_idle_games', { account })
    } catch (error) {
      console.error('Error in (start_auto_idle_games):', error)
      setErrorCode(String(error))
      return null
    } finally {
      setIsStarting(false)
    }
  }, [account])

  return {
    games,
    isLoading,
    errorCode,
    pendingAppIds,
    isStarting,
    addGame,
    removeGame,
    reorder,
    setEnabled,
    toggleQueued,
    startNow,
  }
}
