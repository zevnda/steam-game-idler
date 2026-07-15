import type { CardFarmingBlacklistEntry } from '../types'
import { useCallback, useEffect, useState } from 'react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { invoke } from '@/shared/utils/invoke'

// Mirrors useCardFarmingQueue.ts's shape (fetch-on-mount, per-account) minus reorder/toggle - a
// game only ever enters the blacklist from a "Games With Drops" browse card (`add`) and only ever
// leaves it from the "Blacklisted" tab (`remove`), so there's no single-button toggle to wrap the
// way `toggleQueued` wraps add/remove for the queue.
export const useCardFarmingBlacklist = () => {
  const account = useSessionStore(state => state.account)
  const [blacklist, setBlacklist] = useState<CardFarmingBlacklistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [pendingAppIds, setPendingAppIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!account) {
      setBlacklist([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setErrorCode(null)

    invoke<CardFarmingBlacklistEntry[]>('get_card_farming_blacklist', { account })
      .then(result => {
        if (!cancelled) setBlacklist(result)
      })
      .catch(error => {
        if (!cancelled) {
          console.error('Error in (get_card_farming_blacklist):', error)
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

  const addToBlacklist = useCallback(
    async (game: CardFarmingBlacklistEntry) => {
      if (!account) return
      setPendingAppIds(prev => new Set(prev).add(game.appId))
      try {
        setBlacklist(
          await invoke<CardFarmingBlacklistEntry[]>('add_to_card_farming_blacklist', {
            account,
            game,
          }),
        )
      } catch (error) {
        console.error('Error in (add_to_card_farming_blacklist):', error)
        setErrorCode(String(error))
      } finally {
        setPendingAppIds(prev => {
          const next = new Set(prev)
          next.delete(game.appId)
          return next
        })
      }
    },
    [account],
  )

  const removeFromBlacklist = useCallback(
    async (appId: number) => {
      if (!account) return
      setPendingAppIds(prev => new Set(prev).add(appId))
      try {
        setBlacklist(
          await invoke<CardFarmingBlacklistEntry[]>('remove_from_card_farming_blacklist', {
            account,
            appId,
          }),
        )
      } catch (error) {
        console.error('Error in (remove_from_card_farming_blacklist):', error)
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

  const clearBlacklist = useCallback(async () => {
    if (!account) return
    try {
      setBlacklist(
        await invoke<CardFarmingBlacklistEntry[]>('clear_card_farming_blacklist', { account }),
      )
    } catch (error) {
      console.error('Error in (clear_card_farming_blacklist):', error)
      setErrorCode(String(error))
    }
  }, [account])

  return {
    blacklist,
    isLoading,
    errorCode,
    pendingAppIds,
    addToBlacklist,
    removeFromBlacklist,
    clearBlacklist,
  }
}
