import { useEffect } from 'react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { computeAllowedAccountKeys } from '@/shared/utils/subscriptionAccess'

// Mounted once in DashboardShell alongside useSteamMonitor/useAutoIdleStartup. A subscription
// downgrade can drop the concurrent-agent-account cap below the number of accounts already signed
// in. The app must never force-sign-out an over-cap account (AccountSwitcher's rows dim and
// reroute to the upsell modal instead), but leaving the *active* account silently pointed at a
// now-locked one would strand the user with no way back except reopening the switcher. This falls
// back to the very first account ever added instead, which `computeAllowedAccountKeys` guarantees
// is always allowed regardless of tier.
//
// Gated on `isSubscribed !== null` (a real check has resolved) - `subscriptionTier` starts as
// `null` on every cold boot until hydrate runs, and treating that transient null as "free tier"
// would bounce a Gamer-tier user's genuinely-active 4th account back to their first on every launch.
export const useAgentAccountCapEnforcement = () => {
  const accounts = useSessionStore(state => state.accounts)
  const activeAccountKey = useSessionStore(state => state.activeAccountKey)
  const switchAccount = useSessionStore(state => state.switchAccount)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const isSubscribed = useSubscriptionStore(state => state.isSubscribed)

  useEffect(() => {
    if (!activeAccountKey || isSubscribed === null) return

    const allowedKeys = computeAllowedAccountKeys(accounts, subscriptionTier)
    if (allowedKeys.has(activeAccountKey)) return

    const fallbackKey = Object.keys(accounts)[0]
    if (fallbackKey && fallbackKey !== activeAccountKey) switchAccount(fallbackKey)
  }, [accounts, activeAccountKey, isSubscribed, subscriptionTier, switchAccount])
}
