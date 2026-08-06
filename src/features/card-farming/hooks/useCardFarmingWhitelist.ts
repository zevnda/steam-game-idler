import type { CardFarmingWhitelistEntry } from '../types'
import { useCallback, useEffect, useState } from 'react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { onGameListChange } from '@/shared/utils/gameListsBus'
import { invoke } from '@/shared/utils/invoke'

// Mirrors useCardFarmingBlacklist.ts's shape closely - a page-scoped fetch-on-mount list with no
// ordering concept, plus a `toggle` convenience wrapper for the "Games With Drops" browse tab's
// single button (blacklist has no equivalent since its browse-card action only ever adds). When
// non-empty, this list restricts what `start_farming` will farm - see `card_farming::whitelist`'s
// doc comment. The app prunes entries automatically as they become ineligible (reported via
// `state.completed`); the user only ever adds/removes here.
export const useCardFarmingWhitelist = () => {
  const account = useSessionStore(state => state.account)
  const [whitelist, setWhitelist] = useState<CardFarmingWhitelistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [pendingAppIds, setPendingAppIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!account) {
      setWhitelist([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setErrorCode(null)

    invoke<CardFarmingWhitelistEntry[]>('get_card_farming_whitelist', { account })
      .then(result => {
        if (!cancelled) setWhitelist(result)
      })
      .catch(error => {
        if (!cancelled) {
          console.error('Error in (get_card_farming_whitelist):', error)
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

  // The game-card context menu (useContextMenu.ts) can add to this whitelist from outside this
  // page's own UI, bypassing addToWhitelist below - subscribe so this instance's list stays
  // correct without needing a remount. See gameListsBus.ts's own doc comment.
  useEffect(() => onGameListChange('cardFarmingWhitelist', setWhitelist), [])

  // The running cycle prunes this list automatically as entries become ineligible (see
  // `card_farming::manager::resolve_candidates`'s doc comment), but `FarmingState`'s change event
  // doesn't carry the persisted whitelist itself - so this local copy goes stale mid-run/at run-end
  // unless the caller explicitly refetches. Exposed instead of handled internally here since this
  // hook has no idea when a cycle starts/stops/prunes something (that's `useCardFarming`/
  // `cardFarmingStore`'s concern) - mirrors the pre-rewrite queue hook's identical `refresh`.
  const refresh = useCallback(async () => {
    if (!account) return
    try {
      setWhitelist(
        await invoke<CardFarmingWhitelistEntry[]>('get_card_farming_whitelist', { account }),
      )
    } catch (error) {
      console.error('Error in (get_card_farming_whitelist):', error)
      setErrorCode(String(error))
    }
  }, [account])

  const addToWhitelist = useCallback(
    async (game: CardFarmingWhitelistEntry) => {
      if (!account) return
      try {
        setWhitelist(
          await invoke<CardFarmingWhitelistEntry[]>('add_to_card_farming_whitelist', {
            account,
            game,
          }),
        )
      } catch (error) {
        console.error('Error in (add_to_card_farming_whitelist):', error)
        setErrorCode(String(error))
      }
    },
    [account],
  )

  const removeFromWhitelist = useCallback(
    async (appId: number) => {
      if (!account) return
      setPendingAppIds(prev => new Set(prev).add(appId))
      try {
        setWhitelist(
          await invoke<CardFarmingWhitelistEntry[]>('remove_from_card_farming_whitelist', {
            account,
            appId,
          }),
        )
      } catch (error) {
        console.error('Error in (remove_from_card_farming_whitelist):', error)
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

  const clearWhitelist = useCallback(async () => {
    if (!account) return
    try {
      setWhitelist(
        await invoke<CardFarmingWhitelistEntry[]>('clear_card_farming_whitelist', { account }),
      )
    } catch (error) {
      console.error('Error in (clear_card_farming_whitelist):', error)
      setErrorCode(String(error))
    }
  }, [account])

  // Convenience wrapper for the "Games With Drops" tab's single toggle button - tracks per-game
  // pending state so a card disables itself while its own request is in flight.
  const toggleWhitelisted = useCallback(
    async (appId: number, name: string) => {
      setPendingAppIds(prev => new Set(prev).add(appId))
      try {
        const isWhitelisted = whitelist.some(game => game.appId === appId)
        if (isWhitelisted) {
          await removeFromWhitelist(appId)
        } else {
          await addToWhitelist({ appId, name })
        }
      } finally {
        setPendingAppIds(prev => {
          const next = new Set(prev)
          next.delete(appId)
          return next
        })
      }
    },
    [whitelist, addToWhitelist, removeFromWhitelist],
  )

  return {
    whitelist,
    isLoading,
    errorCode,
    pendingAppIds,
    addToWhitelist,
    removeFromWhitelist,
    clearWhitelist,
    toggleWhitelisted,
    refresh,
  }
}
