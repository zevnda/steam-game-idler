import type { AchievementUnlockerEntry } from '../types'
import { useCallback, useEffect, useState } from 'react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { invoke } from '@/shared/utils/invoke'

// Mirrors favorites/hooks/useFavorites.ts exactly - same shape problem (a per-account ordered list
// of app ids, mutated by independent add/remove/reorder clicks), same reasoning for why this is a
// page-scoped fetch-on-mount rather than a DashboardShell-mounted sync hook: the queue only ever
// changes from a click inside this feature's own UI, it doesn't drift externally.
export const useAchievementUnlockerQueue = () => {
  const account = useSessionStore(state => state.account)
  const [queue, setQueue] = useState<AchievementUnlockerEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [pendingAppIds, setPendingAppIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!account) {
      setQueue([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setErrorCode(null)

    invoke<AchievementUnlockerEntry[]>('get_achievement_unlocker_queue', { account })
      .then(result => {
        if (!cancelled) setQueue(result)
      })
      .catch(error => {
        if (!cancelled) {
          console.error('Error in (get_achievement_unlocker_queue):', error)
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

  // A run auto-dequeues (`cache::remove`) each game as it finishes, but that mutation isn't part
  // of `AchievementUnlockerState`/its change event (see that type's doc comment) - so this local
  // `queue` copy goes stale mid-run/at run-end unless the caller explicitly refetches once a run
  // stops. Exposed instead of handled internally here since this hook has no idea when a run
  // starts/stops (that's `useAchievementUnlockerRun`/`achievementUnlockerStore`'s concern).
  const refresh = useCallback(async () => {
    if (!account) return
    try {
      setQueue(
        await invoke<AchievementUnlockerEntry[]>('get_achievement_unlocker_queue', { account }),
      )
    } catch (error) {
      console.error('Error in (get_achievement_unlocker_queue):', error)
      setErrorCode(String(error))
    }
  }, [account])

  const addToQueue = useCallback(
    async (game: AchievementUnlockerEntry) => {
      if (!account) return
      try {
        setQueue(
          await invoke<AchievementUnlockerEntry[]>('add_to_achievement_unlocker_queue', {
            account,
            game,
          }),
        )
      } catch (error) {
        console.error('Error in (add_to_achievement_unlocker_queue):', error)
        setErrorCode(String(error))
      }
    },
    [account],
  )

  const removeFromQueue = useCallback(
    async (appId: number) => {
      if (!account) return
      setPendingAppIds(prev => new Set(prev).add(appId))
      try {
        setQueue(
          await invoke<AchievementUnlockerEntry[]>('remove_from_achievement_unlocker_queue', {
            account,
            appId,
          }),
        )
      } catch (error) {
        console.error('Error in (remove_from_achievement_unlocker_queue):', error)
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
    async (newOrder: AchievementUnlockerEntry[]) => {
      if (!account) return
      // Optimistic, same reasoning as favorites' reorder - a drag reorder has no "correct" previous
      // state worth restoring on failure.
      setQueue(newOrder)
      try {
        await invoke<AchievementUnlockerEntry[]>('set_achievement_unlocker_queue_order', {
          account,
          queue: newOrder,
        })
      } catch (error) {
        console.error('Error in (set_achievement_unlocker_queue_order):', error)
        setErrorCode(String(error))
      }
    },
    [account],
  )

  // Convenience wrapper for the "All Games" tab's single toggle button - tracks per-game pending
  // state so a card disables itself while its own request is in flight.
  const toggleQueued = useCallback(
    async (appId: number, name: string) => {
      setPendingAppIds(prev => new Set(prev).add(appId))
      try {
        const isQueued = queue.some(game => game.appId === appId)
        if (isQueued) {
          await removeFromQueue(appId)
        } else {
          await addToQueue({ appId, name })
        }
      } finally {
        setPendingAppIds(prev => {
          const next = new Set(prev)
          next.delete(appId)
          return next
        })
      }
    },
    [queue, addToQueue, removeFromQueue],
  )

  return {
    queue,
    isLoading,
    errorCode,
    pendingAppIds,
    addToQueue,
    removeFromQueue,
    reorder,
    toggleQueued,
    refresh,
  }
}
