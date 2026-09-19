import type { IdleSetResult } from '@/features/idling/types'
import type { AccountKey, SignedInAccount } from '@/shared/stores/sessionStore'
import { useEffect, useRef } from 'react'
import { syncClaims } from '@/features/idling/hooks/useIdlingSync'
import { useIdlingStore } from '@/shared/stores/idlingStore'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { invoke } from '@/shared/utils/invoke'
import { computeAllowedAccountKeys } from '@/shared/utils/subscriptionAccess'

const STEAM_POLL_INTERVAL_MS = 10_000
const STEAM_POLL_TIMEOUT_MS = 5 * 60_000
const SETTLE_DELAY_MS = 15_000

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Fires once per *account* per app session (not once globally) - mounted from `DashboardShell`
// (never unmounted within `/dashboard/*` - see that file's own doc comment) so a given account is
// never re-triggered by a route change, only by genuinely becoming signed-in for the first time
// this session. Every signed-in account gets its auto-idle queue started on launch, not just
// whichever one happens to be active - `sessionStore.accounts` already holds a live, resumed
// session for every one of them by the time this runs (see `useSessionBootstrap`), so there's
// nothing account-switching itself needs to kick off.
//
// Ports `main`'s `handleStartAutoIdleGames.ts` wait behavior: CLI mode has no live session of its
// own to know Steam is ready, so it polls `is_steam_running` (every 10s, 5 minute timeout -
// matching `main`'s constants exactly) and gives up silently if Steam never comes up, then waits a
// further settle delay before actually starting (`main`'s own comment: games launched immediately
// after Steam itself finishes starting tend to fail to register). Agent mode skips all of this -
// the daemon session is already live and signed in by the time this runs, so there's nothing to
// wait for.
export const useAutoIdleStartup = () => {
  const accounts = useSessionStore(state => state.accounts)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const isSubscribed = useSubscriptionStore(state => state.isSubscribed)
  const setAppIds = useIdlingStore(state => state.setAppIds)
  const setClaimsByOwner = useIdlingStore(state => state.setClaimsByOwner)
  const startedKeysRef = useRef(new Set<AccountKey>())

  useEffect(() => {
    // Mirrors `useAgentAccountCapEnforcement`'s own gate: `subscriptionTier` starts `null` on cold
    // boot until the real check resolves, and computing the allowed set against that transient
    // null would wrongly cap this to one (free-tier) account and skip starting the rest.
    if (isSubscribed === null) return

    // Never re-establishes a backend session and never starts idling for an account beyond the
    // current tier's concurrent-account cap - mirrors `useSessionBootstrap`'s `overCapAccounts`
    // handling. Those accounts are still present in `accounts` (dimmed/upsell-only in the
    // switcher), but have no live `AgentManager` session for `start_auto_idle_games` to resolve.
    const allowedKeys = computeAllowedAccountKeys(accounts, subscriptionTier)

    const start = async (key: AccountKey, account: SignedInAccount) => {
      try {
        if (account.mode === 'local') {
          let steamIsRunning = await invoke<boolean>('is_steam_running')
          const deadline = Date.now() + STEAM_POLL_TIMEOUT_MS
          while (!steamIsRunning && Date.now() < deadline) {
            await sleep(STEAM_POLL_INTERVAL_MS)
            steamIsRunning = await invoke<boolean>('is_steam_running')
          }
          if (!steamIsRunning) return
          await sleep(SETTLE_DELAY_MS)
        }

        // The daemon path's confirming `idling-state-changed` event is emitted independently/later
        // (see steam_agent/manager.rs's set_idle_games doc comment) and can be missed if it races
        // useIdlingSync's listener registration, so commit this command's own result directly
        // instead of relying solely on that event - same pattern as useIdling's toggleIdle/stopAll.
        const result = await invoke<IdleSetResult>('start_auto_idle_games', { account })
        setAppIds(key, result.appIds)
        syncClaims(key, account, setClaimsByOwner)
      } catch (error) {
        console.error('Error in (start_auto_idle_games):', error)
      }
    }

    for (const [key, account] of Object.entries(accounts)) {
      if (!allowedKeys.has(key) || startedKeysRef.current.has(key)) continue
      // Marked started before the async work below even begins, not after it resolves - `accounts`
      // can gain entries in more than one wave (bootstrap's stragglers, or a fresh "Add another
      // account" sign-in), and each wave re-runs this whole effect against the full map, so this is
      // what stops an already-in-flight account from being started a second time.
      startedKeysRef.current.add(key)
      start(key, account)
    }
  }, [accounts, subscriptionTier, isSubscribed, setAppIds, setClaimsByOwner])
}
