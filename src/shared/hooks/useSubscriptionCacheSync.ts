import { useEffect } from 'react'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'

// Mounted once in DashboardShell, before useCheckSubscription - hydrates `subscriptionStore` from
// its last confirmed check (see `persistSubscriptionCache`) on mount, mirroring
// `useSortPreferencesSync`'s hydrate-on-mount shape (localStorage isn't available during Next.js's
// SSR pass, so this can't run at module init). Lets Sidebar's tier row, HelpDesk, and GoPro render
// a returning user's real tier on first paint instead of popping in once the live subscription API
// round trip resolves.
export const useSubscriptionCacheSync = () => {
  useEffect(() => {
    useSubscriptionStore.getState().hydrate()
  }, [])
}
