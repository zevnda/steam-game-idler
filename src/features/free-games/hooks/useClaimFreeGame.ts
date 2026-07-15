import type { FreeGameClaimOutcome } from '../types'
import { useCallback, useState } from 'react'
import { fetchGamesList } from '@/features/games-list/hooks/useGamesListSync'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { invoke } from '@/shared/utils/invoke'

// Per-app claim action + inline result state, rendered directly on each `FreeGameCard` -
// deliberately kept inline rather than moved to a toast now that a toast system exists: the
// outcome (claimed checkmark, "already owned" note, failure
// reason) is durable per-card state a user can come back and check later, not a one-off event
// that's fine to miss if they glance away - a toast would disappear before conveying that.
export const useClaimFreeGame = (onGranted: (appId: number) => void) => {
  const account = useSessionStore(state => state.account)
  const [pendingAppIds, setPendingAppIds] = useState<Set<number>>(new Set())
  const [outcomes, setOutcomes] = useState<Record<number, FreeGameClaimOutcome>>({})
  const [errorCodes, setErrorCodes] = useState<Record<number, string>>({})

  const claim = useCallback(
    async (appId: number) => {
      if (!account) return
      setPendingAppIds(prev => new Set(prev).add(appId))
      setErrorCodes(prev => {
        const next = { ...prev }
        delete next[appId]
        return next
      })

      try {
        const outcome = await invoke<FreeGameClaimOutcome>('claim_free_game', { account, appId })
        setOutcomes(prev => ({ ...prev, [appId]: outcome }))
        if (outcome.outcome === 'granted') {
          onGranted(appId)
          // Refreshes the shared owned-games list so playtime/ownership is correct elsewhere in
          // the app (games list, idling) without waiting on its own staleness window - reuses the
          // same fetch games-list's manual refresh button already drives, see useGamesListSync.
          fetchGamesList(account)
        }
      } catch (error) {
        console.error('Error in (claim_free_game):', error)
        setErrorCodes(prev => ({ ...prev, [appId]: String(error) }))
      } finally {
        setPendingAppIds(prev => {
          const next = new Set(prev)
          next.delete(appId)
          return next
        })
      }
    },
    [account, onGranted],
  )

  return { pendingAppIds, outcomes, errorCodes, claim }
}
