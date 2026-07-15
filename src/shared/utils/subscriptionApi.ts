import type { ProTier } from './subscriptionAccess'
import { GRANDFATHER_CUTOFF } from './subscriptionAccess'
import { persistSubscriptionCache, useSubscriptionStore } from '@/shared/stores/subscriptionStore'

export const SUBSCRIPTION_API_URL = 'https://apibase.vercel.app/api/subscriptions'

export interface SubscriptionApiResult {
  // A real status string ('active'/'past_due'/'canceled'/...), not a bare success flag - also
  // used as a truthy check in `useCheckSubscription` to decide subscribed-vs-cleared, same as
  // `main`'s equivalent.
  status?: string
  tier?: string
  created_at?: string
  email?: string
  current_period_end?: string
  cancel_at_period_end?: boolean
  payment_provider?: string
}

// Applies a successful /api/subscriptions response to subscriptionStore - shared by
// useCheckSubscription's periodic poll and useSubscriptionSettings' manual activate/transfer
// actions, so the grandfather-cutoff rule and field mapping only exist in one place rather than
// being copy-pasted between the two call sites.
export function applySubscriptionResult(results: SubscriptionApiResult) {
  // Only ever trusts an explicit, recognized tier string - an ambiguous/malformed response (a
  // `status` present but `tier` missing or unrecognized) resolves to `null` (no gated access)
  // rather than defaulting toward `casual`. Every gate in this app ultimately traces back to this
  // one function with no Rust-side backstop, so an unclear response should never
  // silently grant more access than the API actually confirmed.
  const tier: ProTier = results.tier === 'casual' || results.tier === 'gamer' ? results.tier : null
  const createdAt = results.created_at
  // Grandfather: subscribers before cutoff get full Gamer access regardless of plan
  const resolvedTier = createdAt && new Date(createdAt) < GRANDFATHER_CUTOFF ? 'gamer' : tier

  const subscriptionDetails = {
    email: results.email ?? null,
    currentPeriodEnd: results.current_period_end ?? null,
    cancelAtPeriodEnd: results.cancel_at_period_end ?? null,
    status: results.status ?? null,
    paymentProvider: results.payment_provider ?? null,
  }

  useSubscriptionStore.setState({
    isSubscribed: true,
    subscriptionTier: resolvedTier,
    subscriptionDetails,
  })
  persistSubscriptionCache({
    isSubscribed: true,
    subscriptionTier: resolvedTier,
    subscriptionDetails,
  })
}

export function clearSubscription() {
  useSubscriptionStore.setState({
    isSubscribed: false,
    subscriptionTier: null,
    subscriptionDetails: null,
  })
  persistSubscriptionCache({
    isSubscribed: false,
    subscriptionTier: null,
    subscriptionDetails: null,
  })
}

// Resets to the pre-check "unknown" state (`isSubscribed: null`) rather than `clearSubscription`'s
// "confirmed unsubscribed" (`false`) - subscriptions are app-wide (a `licenseKey` in localStorage,
// not tied to any one Steam account), so signing
// out to zero accounts doesn't mean the device lost its subscription, just that nothing is left to
// check with (`useCheckSubscription`'s effect requires a truthy `account` to run at all, so it
// would otherwise never re-fire to correct a stale value). Root-mounted readers like `useTheme`
// already treat `null` as "trust the provisional state, don't flash to default" - reusing `false`
// here would incorrectly strip a gated theme back to default on the sign-in screen.
export function resetSubscription() {
  useSubscriptionStore.setState({
    isSubscribed: null,
    subscriptionTier: null,
    subscriptionDetails: null,
  })
}
