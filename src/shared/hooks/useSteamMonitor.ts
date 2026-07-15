import type { SignedInAccount } from '@/shared/stores/sessionStore'
import { listen } from '@tauri-apps/api/event'
import { useEffect } from 'react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSteamWarningStore } from '@/shared/stores/steamWarningStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'

// Matches src-tauri/src/local_steam/commands.rs's STEAM_STATUS_EVENT constant.
const STEAM_STATUS_EVENT = 'steam-status-changed'

interface SteamStatusEventPayload {
  isRunning: boolean
}

// Only ever at most one CLI-mode ("local") account can exist at a time - a real local Steam client
// can only be logged into one account - so there's no ambiguity in picking
// "the" local entry, independent of which account is denormalized as "active".
function resolveLocalAccount() {
  const entry = Object.values(useSessionStore.getState().accounts).find(
    account => account.mode === 'local',
  )
  return entry ?? null
}

// Stops CLI-mode automations that can no longer function once the local Steam client they depend
// on has closed. Each stop command is independently idempotent (a no-op if nothing was tracked) and
// already logs its own failure via the shared `invoke` wrapper - run them concurrently rather than
// sequentially so one hanging/failing command doesn't delay the others.
async function stopLocalAutomations(account: SignedInAccount) {
  await Promise.allSettled([
    invoke('stop_all_idling', { account }),
    invoke('stop_farming', { account }),
    invoke('stop_achievement_unlocker', { account }),
  ])
}

// Mounted once in DashboardShell alongside `SteamWarning` - CLI-mode only, since agent mode has no
// dependency on a local Steam client. Starts the
// backend's steam.exe status poll once a CLI-mode account is signed in, and reacts to it going down
// mid-session by stopping whatever CLI-mode automation depended on it and surfacing the
// SteamWarning modal. Mirrors `main`'s `useSteamMonitor.ts`, minus its `running_processes_changed`
// listener - idling's process list already syncs independently via `useIdlingSync`'s own
// `IDLE_STATE_EVENT`, so there's nothing left for that second listener to do here.
export const useSteamMonitor = () => {
  const hasLocalAccount = useSessionStore(state =>
    Object.values(state.accounts).some(account => account.mode === 'local'),
  )
  const setShowSteamWarning = useSteamWarningStore(state => state.setShowSteamWarning)

  useEffect(() => {
    if (!hasLocalAccount) return

    invoke('start_steam_status_monitor').catch(error => {
      console.error('Error in (start_steam_status_monitor):', error)
    })

    const unlisten = listen<SteamStatusEventPayload>(STEAM_STATUS_EVENT, event => {
      if (event.payload.isRunning) return

      const account = resolveLocalAccount()
      if (!account) return

      logFrontendInfo('useSteamMonitor', 'local Steam client closed, stopping CLI-mode automations')
      setShowSteamWarning(true)
      stopLocalAutomations(account)
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [hasLocalAccount, setShowSteamWarning])
}
