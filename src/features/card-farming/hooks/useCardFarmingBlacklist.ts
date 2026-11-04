import type { CardFarmingBlacklistEntry } from '../types'
import { useCallback, useEffect, useState } from 'react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { onGameListChange } from '@/shared/utils/gameListsBus'
import { invoke } from '@/shared/utils/invoke'

// Mirrors useCardFarmingWhitelist.ts's shape (fetch-on-mount, per-account) minus the toggle - on
// this page a game enters the blacklist from a "Games With Drops" browse card (`add`) and leaves it
// from the "Blacklisted" tab (`remove`), so there's no single-button toggle to wrap the way
// `toggleWhitelisted` wraps add/remove for the whitelist. The game card context menu's Lists
// submenu can do either from any page; this hears about it through gameListsBus.ts.
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

  // The game card context menu can blacklist a game from any page (see gameListsBus.ts)
  useEffect(() => onGameListChange('cardFarmingBlacklist', setBlacklist), [])

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
