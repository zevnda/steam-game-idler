import type { Settings } from '@/features/settings/types'
import { useEffect } from 'react'
import { useAntiAwayStore } from '@/shared/stores/antiAwayStore'
import { invoke } from '@/shared/utils/invoke'

const ANTI_AWAY_INTERVAL_MS = 3 * 60 * 1000

// Pokes the local Steam client's online status once, silently no-oping if no local client is
// running to handle the `steam://` URI (an agent-mode session with no local client, or a CLI-mode
// session that hasn't started Steam yet) - mirrors `main`'s `antiAwayStatus` gating on
// `is_steam_running` exactly (src/shared/utils/tasks.ts).
const pokeIfSteamRunning = async () => {
  try {
    if (await invoke<boolean>('is_steam_running')) {
      await invoke('anti_away')
    }
  } catch (error) {
    console.error('Error in (anti_away):', error)
  }
}

// Mounted once in DashboardShell (never unmounted within /dashboard/*, see that file's own doc
// comment) so the interval survives route changes and only ever runs once per app session, the
// same reasoning useAutoIdleStartup/useCardFarmingSync already use for their own DashboardShell-
// mounted hooks. Hydrates `antiAwayStore` from the real persisted setting on mount, then starts/
// stops the 3-minute proof-of-life interval as that store's `enabled` flag changes live - not just
// once at mount - so toggling the switch in GeneralSettingsTab takes effect immediately.
export const useAntiAwayStatus = () => {
  const enabled = useAntiAwayStore(state => state.enabled)
  const setEnabled = useAntiAwayStore(state => state.setEnabled)

  useEffect(() => {
    invoke<Settings>('get_settings')
      .then(settings => setEnabled(settings.antiAway))
      .catch(error => {
        console.error('Error in (get_settings) for anti-away hydration:', error)
      })
    // Intentionally runs once per mount, not per `setEnabled` identity change - this is a one-time
    // hydration from disk, not something that should re-run when the store's own setter re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!enabled) return

    pokeIfSteamRunning()
    const interval = setInterval(pokeIfSteamRunning, ANTI_AWAY_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [enabled])
}
