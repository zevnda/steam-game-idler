import type { PresenceSettings } from '@/features/settings/types'
import type { SignedInAccount } from '@/shared/stores/sessionStore'
import { useEffect } from 'react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { invoke } from '@/shared/utils/invoke'
import { hasGamerAccess } from '@/shared/utils/subscriptionAccess'

// Mounted once in DashboardShell alongside useAgentAccountCapEnforcement, which this mirrors -
// same `isSubscribed !== null` gating and trigger. Presence settings are unusual among Pro gates:
// Rust reapplies `presence_settings.json` on every `idle_set` call, including ones triggered from a
// purely backend automation loop with no frontend round-trip (achievement-unlocker, card farming,
// auto-idle), so blocking further edits in GeneralSettingsTab isn't enough - Rust would keep
// blindly reapplying whatever's already on disk regardless of tier unless the persisted values
// themselves are corrected. This is the one lever that reaches every trigger path.
//
// Resets `personaState` to `Online` and clears `customIdleStatus` for every signed-in agent-mode
// account once a downgrade is confirmed - reuses `agent_set_presence_settings` unchanged (persists
// and live-applies), so no new backend surface is needed. Naturally idempotent, so re-running on
// every dependency change is safe rather than needing a one-shot ref.
export const usePresenceProGuard = () => {
  const accounts = useSessionStore(state => state.accounts)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const isSubscribed = useSubscriptionStore(state => state.isSubscribed)

  useEffect(() => {
    if (isSubscribed === null || hasGamerAccess(subscriptionTier)) return

    Object.values(accounts)
      .filter(
        (account): account is Extract<SignedInAccount, { mode: 'agent' }> =>
          account.mode === 'agent',
      )
      .forEach(async ({ username }) => {
        try {
          const settings = await invoke<PresenceSettings>('agent_get_presence_settings', {
            username,
          })
          if (settings.personaState === 'Online' && !settings.customIdleStatus) return

          await invoke('agent_set_presence_settings', {
            username,
            settings: { personaState: 'Online', customIdleStatus: null },
          })
        } catch (error) {
          console.error('Error in (agent_set_presence_settings) for presence pro-guard:', error)
        }
      })
  }, [accounts, isSubscribed, subscriptionTier])
}
