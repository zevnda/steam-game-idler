import type { OwnedGame } from '@/features/games-list/types'
import type { SignedInAccount } from '@/shared/stores/sessionStore'
import type { IdleOwner, IdleSetResult } from '../types'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessageKey } from '../utils/errorMessageKey'
import { syncClaims } from './useIdlingSync'
import { toast } from '@heroui/react'
import { useCardFarmingStore } from '@/shared/stores/cardFarmingStore'
import { useIdlingStore } from '@/shared/stores/idlingStore'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { invoke } from '@/shared/utils/invoke'

// The command each owner's per-section "Stop" needs to call. Card-farming/achievement-unlocker
// have a real per-account session loop that would just re-claim their games on its next tick if
// only the idling claim were released, so their section stop calls their own existing stop command
// instead (which already releases the claim as part of stopping the loop) - manual/auto-idle have
// no loop of their own, so releasing the claim directly is the correct and sufficient stop. See
// idling::claims::IdleClaimsRegistry::clear_owner's doc comment for the full reasoning.
function stopOwnerCommand(owner: IdleOwner, account: SignedInAccount) {
  switch (owner) {
    case 'card_farming':
      return { command: 'stop_farming', params: { account } }
    case 'achievement_unlocker':
      return { command: 'stop_achievement_unlocker', params: { account } }
    case 'manual':
    case 'auto_idle':
      return { command: 'stop_owner_idling', params: { account, owner } }
  }
}

// Start/stop actions for the idling page. Reads `idlingStore` (kept current by `useIdlingSync`,
// mounted permanently in `DashboardShell`) rather than tracking its own copy of "what's idling" -
// there's only ever one source of truth for that, regardless of which component is currently
// driving a change to it. `games` supplies the name `toggle_manual_idle` needs for CLI mode's
// hidden-process window title (see idling::IdleTarget's doc comment) - passed in rather than
// fetched here, since games-list's `useGamesList` already owns that fetch/cache logic.
//
// Toggle/stop-all go through the backend's `toggle_manual_idle`/`stop_all_idling` commands rather
// than hand-computing a full replacement list and sending it to a raw `set_idle_games` - the
// backend's `idling::claims` registry is the sole authority on the union of what every owner
// (this page, auto-idle, achievement-unlocker, card farming) currently wants idling, so this hook
// no longer reads `idlingStore`'s snapshot to compute the "whole" desired set itself. Doing that
// used to risk a race where a concurrent automation's claim change got clobbered by a
// slightly-stale full-replace originating here.
//
// Neither action applies its own `IdleSetResult.appIds` to `idlingStore` directly (an earlier
// version of this hook did) - only `.failures` is read here for the toast. In agent mode,
// `AgentManager::set_idle_games`'s own doc comment (src-tauri/src/steam_agent/manager.rs) states
// its return value is an unconfirmed request echo, not a confirmed result - the daemon's real
// `idle_state` event isn't correlated to the request and can arrive (and get applied by
// `useIdlingSync`) before this command's own promise resolves back here, so reapplying that stale
// echo directly could clobber a concurrently-arrived, more current state.
//
// Both actions also call `refreshIdleState` (a fresh `get_idle_state` read, not the command's own
// echo) once the command resolves - closes a race with `useIdlingSync`'s event listener:
// `listen()` registration is itself async, so a user clicking idle/stop right after a fast
// sign-in can trigger the backend's `idling-state-changed` push before the listener is live,
// silently dropping the only update that would reflect this action. A fetch taken after the
// command resolves always reflects backend truth at that point, so it can't go stale the way a
// push-event race can.
//
// `startTimes` merges in `cardFarmingStore`'s own `activeSince` for any app id currently in card
// farming's `active` list, overriding `idlingStore`'s raw physical-state-derived timestamp for
// those games specifically. This matters because card farming's restart-cycle deliberately stops
// and restarts idling every few minutes (see `card_farming::manager::run_restart_cycle`'s doc
// comment) - `idlingStore.setAppIds` has no backend timestamp of its own and resets an app id's
// clock the instant any single observed `IDLE_STATE_EVENT`/poll shows it briefly absent, so without
// this merge the on-card elapsed-idling timer would visibly reset every restart-cycle iteration for
// every card-farming-managed game. `card_farming::FarmingProgress::active_since` is specifically
// designed to stay stable across those internal blips (only resetting if the game genuinely leaves
// `active`), which is exactly the value this needs instead. Every other game (idling via manual/
// auto-idle/achievement-unlocker, or a card-farming game merely sitting in `queue` rather than
// `active`) is untouched, still sourced from `idlingStore` exactly as before.
export const useIdling = (games: OwnedGame[]) => {
  const { t } = useTranslation()
  const account = useSessionStore(state => state.account)
  const appIds = useIdlingStore(state => state.appIds)
  const rawStartTimes = useIdlingStore(state => state.startTimes)
  const cardFarmingActive = useCardFarmingStore(state => state.state.active)
  const startTimes = useMemo(() => {
    if (cardFarmingActive.length === 0) return rawStartTimes
    const merged = { ...rawStartTimes }
    for (const progress of cardFarmingActive) {
      merged[progress.appId] = progress.activeSince
    }
    return merged
  }, [rawStartTimes, cardFarmingActive])
  const claimsByOwner = useIdlingStore(state => state.claimsByOwner)
  const setAppIds = useIdlingStore(state => state.setAppIds)
  const setClaimsByOwner = useIdlingStore(state => state.setClaimsByOwner)
  const [pendingAppIds, setPendingAppIds] = useState<Set<number>>(new Set())
  const [isStoppingAll, setIsStoppingAll] = useState(false)
  const [pendingOwners, setPendingOwners] = useState<Set<IdleOwner>>(new Set())

  // One-off action feedback, not persistent page state - a failed toggle/stop shouldn't leave a
  // banner sitting in the page header until the next action happens to clear it (see
  // CLAUDE.md's "use toasts for one-off action feedback" frontend convention).
  const reportFailure = useCallback(
    (code: string) => {
      toast.danger(t(errorMessageKey(code), { code }))
    },
    [t],
  )

  const refreshIdleState = useCallback(async () => {
    if (!account) return
    const key = getAccountKey(account)
    try {
      const freshAppIds = await invoke<number[]>('get_idle_state', { account })
      setAppIds(key, freshAppIds)
      syncClaims(key, account, setClaimsByOwner)
    } catch (error) {
      console.error('Error in (get_idle_state):', error)
    }
  }, [account, setAppIds, setClaimsByOwner])

  const toggleIdle = useCallback(
    async (appId: number) => {
      if (!account) return
      const name = games.find(game => game.appId === appId)?.name ?? String(appId)
      setPendingAppIds(prev => new Set(prev).add(appId))
      try {
        const result = await invoke<IdleSetResult>('toggle_manual_idle', { account, appId, name })
        const failure = result.failures[0]?.error
        if (failure) reportFailure(failure)
        await refreshIdleState()
      } catch (error) {
        console.error('Error in (toggle_manual_idle):', error)
        reportFailure(String(error))
      } finally {
        setPendingAppIds(prev => {
          const next = new Set(prev)
          next.delete(appId)
          return next
        })
      }
    },
    [account, games, reportFailure, refreshIdleState],
  )

  const stopAll = useCallback(async () => {
    if (!account) return
    setIsStoppingAll(true)
    try {
      const result = await invoke<IdleSetResult>('stop_all_idling', { account })
      const failure = result.failures[0]?.error
      if (failure) reportFailure(failure)
      await refreshIdleState()
    } catch (error) {
      console.error('Error in (stop_all_idling):', error)
      reportFailure(String(error))
    } finally {
      setIsStoppingAll(false)
    }
  }, [account, reportFailure, refreshIdleState])

  // Per-section "Stop" on the Idling page - see stopOwnerCommand's doc comment for why this
  // dispatches to a different command depending on the owner. Doesn't reapply its own command
  // result to `idlingStore` (unlike toggleIdle/stopAll, stop_farming/stop_achievement_unlocker
  // return `()`, so there's nothing to reapply anyway) - but still calls `refreshIdleState`
  // afterward for the same reason toggleIdle/stopAll do (see this hook's top doc comment).
  const stopSection = useCallback(
    async (owner: IdleOwner) => {
      if (!account) return
      setPendingOwners(prev => new Set(prev).add(owner))
      const { command, params } = stopOwnerCommand(owner, account)
      try {
        await invoke(command, params)
        await refreshIdleState()
      } catch (error) {
        console.error(`Error in (${command}):`, error)
        reportFailure(String(error))
      } finally {
        setPendingOwners(prev => {
          const next = new Set(prev)
          next.delete(owner)
          return next
        })
      }
    },
    [account, reportFailure, refreshIdleState],
  )

  return {
    appIds,
    startTimes,
    claimsByOwner,
    pendingAppIds,
    isStoppingAll,
    pendingOwners,
    toggleIdle,
    stopAll,
    stopSection,
  }
}
