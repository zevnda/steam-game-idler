import type { IdleSetResult } from '@/features/idling/types'
import { useEffect, useRef } from 'react'
import { syncClaims } from '@/features/idling/hooks/useIdlingSync'
import { useIdlingStore } from '@/shared/stores/idlingStore'
import { getAccountKey, useSessionStore } from '@/shared/stores/sessionStore'
import { invoke } from '@/shared/utils/invoke'

const STEAM_POLL_INTERVAL_MS = 10_000
const STEAM_POLL_TIMEOUT_MS = 5 * 60_000
const SETTLE_DELAY_MS = 15_000

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Fires once per app session, mounted from `DashboardShell` (never unmounted within
// `/dashboard/*` - see that file's own doc comment) so this genuinely only runs once per launch,
// not once per page visit. Ports `main`'s `handleStartAutoIdleGames.ts` wait behavior: CLI mode
// has no live session of its own to know Steam is ready, so it polls `is_steam_running` (every
// 10s, 5 minute timeout - matching `main`'s constants exactly) and gives up silently if Steam
// never comes up, then waits a further settle delay before actually starting (`main`'s own
// comment: games launched immediately after Steam itself finishes starting tend to fail to
// register). Agent mode skips all of this - the daemon session is already live and signed in by
// the time `DashboardShell` mounts (post-sign-in redirect), so there's nothing to wait for.
export const useAutoIdleStartup = () => {
  const account = useSessionStore(state => state.account)
  const setAppIds = useIdlingStore(state => state.setAppIds)
  const setClaimsByOwner = useIdlingStore(state => state.setClaimsByOwner)
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (!account || hasStartedRef.current) return
    hasStartedRef.current = true

    const start = async () => {
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
        const key = getAccountKey(account)
        setAppIds(key, result.appIds)
        syncClaims(key, account, setClaimsByOwner)
      } catch (error) {
        console.error('Error in (start_auto_idle_games):', error)
      }
    }

    start()
  }, [account, setAppIds, setClaimsByOwner])
}
