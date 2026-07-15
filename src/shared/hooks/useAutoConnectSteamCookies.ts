import type { SignedInAccount } from '@/shared/stores/sessionStore'
import type { SteamCookiesLike } from '@/shared/stores/steamCookiesStore'
import { useEffect, useRef, useState } from 'react'
import { useSavedSteamCookies } from './useSavedSteamCookies'
import { getAccountKey } from '@/shared/stores/sessionStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { hasGamerAccess } from '@/shared/utils/subscriptionAccess'

// Decides whether a feature's `SteamCookiesConnectPanel` needs to be shown at all, or whether it
// can be skipped by calling `connect` automatically instead - shared by card-farming and
// inventory-manager's pages. Two auto-connect cases, checked once per account: a gamer-tier
// agent-mode account (its daemon session already mints cookies silently with no login prompt), or
// any account with a previously-saved manual cookie set. Neither case retries once attempted - a
// failed auto-connect just leaves the panel showing for the user to retry manually.
//
// `savedCookies`/`isLoaded` come from `steamCookiesStore` (via `useSavedSteamCookies`), checked
// once per account by `useSteamCookiesSync` in `DashboardShell` rather than fetched fresh on every
// mount. `isChecking`/`isAutoConnecting` let the caller show a neutral loading state instead of the
// connect panel until that check (and any auto-connect it kicks off) has actually settled.
export function useAutoConnectSteamCookies<T extends SteamCookiesLike>(
  account: SignedInAccount | null,
  connect: (manualCookies: T | undefined) => Promise<boolean>,
) {
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const { savedCookies, isLoaded } = useSavedSteamCookies<T>()
  const attemptedKeyRef = useRef<string | null>(null)
  const [isAutoConnecting, setIsAutoConnecting] = useState(false)

  useEffect(() => {
    if (!account || !isLoaded) return
    const accountKey = getAccountKey(account)
    if (attemptedKeyRef.current === accountKey) return
    attemptedKeyRef.current = accountKey

    if (account.mode === 'agent' && hasGamerAccess(subscriptionTier)) {
      setIsAutoConnecting(true)
      connect(undefined).finally(() => setIsAutoConnecting(false))
      return
    }
    if (savedCookies) {
      setIsAutoConnecting(true)
      connect(savedCookies).finally(() => setIsAutoConnecting(false))
    }
  }, [account, isLoaded, subscriptionTier, savedCookies, connect])

  return { isChecking: !isLoaded, isAutoConnecting }
}
