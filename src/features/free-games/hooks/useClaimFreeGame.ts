import type { AccountKey } from '@/shared/stores/sessionStore'
import type { FreeGameClaimOutcome } from '../types'
import { useCallback, useState } from 'react'
import { fetchGamesList } from '@/features/games-list/hooks/useGamesListSync'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { invoke } from '@/shared/utils/invoke'

interface AccountClaimState {
  pendingAppIds: Set<number>
  outcomes: Record<number, FreeGameClaimOutcome>
  errorCodes: Record<number, string>
}

const EMPTY_CLAIM_STATE: AccountClaimState = {
  pendingAppIds: new Set(),
  outcomes: {},
  errorCodes: {},
}

// Per-app claim action + inline result state, rendered directly on each `FreeGameCard` -
// deliberately kept inline rather than moved to a toast now that a toast system exists: the
// outcome (claimed checkmark, "already owned" note, failure
// reason) is durable per-card state a user can come back and check later, not a one-off event
// that's fine to miss if they glance away - a toast would disappear before conveying that.
//
// Keyed by account, not just app id: switching accounts doesn't remount `FreeGamesPage` (same
// route), so app-id-only state would show one account's "Claimed"/failure/pending result on
// another account's card for the same game. A claim also captures the account it started on, so
// one that resolves after a switch still lands on the account that made it.
export const useClaimFreeGame = () => {
  const account = useSessionStore(state => state.account)
  const [claimStates, setClaimStates] = useState<Record<AccountKey, AccountClaimState>>({})

  const claim = useCallback(
    async (appId: number) => {
      if (!account) return
      const key = getAccountKey(account)
      const update = (updater: (state: AccountClaimState) => AccountClaimState) =>
        setClaimStates(prev => ({ ...prev, [key]: updater(prev[key] ?? EMPTY_CLAIM_STATE) }))

      update(state => {
        const errorCodes = { ...state.errorCodes }
        delete errorCodes[appId]
        return { ...state, pendingAppIds: new Set(state.pendingAppIds).add(appId), errorCodes }
      })

      try {
        const outcome = await invoke<FreeGameClaimOutcome>('claim_free_game', { account, appId })
        update(state => ({ ...state, outcomes: { ...state.outcomes, [appId]: outcome } }))
        if (outcome.outcome === 'granted') {
          // Refreshes this account's owned-games list, which is also what drops the game from
          // this account's Free Games tab (`useFreeGames` filters against it) - deliberately not
          // removed from the shared, account-agnostic `freeGamesStore`, which would hide it from
          // every other signed-in account that still hasn't claimed it. Until the refresh lands,
          // the card stays visible showing "Claimed". Also keeps playtime/ownership correct
          // elsewhere (games list, idling) - same fetch games-list's refresh button drives.
          fetchGamesList(account)
        }
      } catch (error) {
        console.error('Error in (claim_free_game):', error)
        update(state => ({ ...state, errorCodes: { ...state.errorCodes, [appId]: String(error) } }))
      } finally {
        update(state => {
          const pendingAppIds = new Set(state.pendingAppIds)
          pendingAppIds.delete(appId)
          return { ...state, pendingAppIds }
        })
      }
    },
    [account],
  )

  const activeState = (account && claimStates[getAccountKey(account)]) || EMPTY_CLAIM_STATE
  return { ...activeState, claim }
}
