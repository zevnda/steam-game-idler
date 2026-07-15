import type { ProTier } from '@/shared/utils/subscriptionAccess'
import { create } from 'zustand'

const STORAGE_KEY = 'cachedSubscription'

export interface SubscriptionDetails {
  email: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean | null
  status: string | null
  paymentProvider: string | null
}

interface CachedSubscription {
  isSubscribed: boolean
  subscriptionTier: ProTier
  subscriptionDetails: SubscriptionDetails | null
}

interface SubscriptionStore {
  // `null` means "not yet checked" (distinct from `false`/"checked, not subscribed") - mirrors
  // `main`'s `isSubscribed` exactly, since UI (e.g. a tier indicator) needs to tell "still loading"
  // apart from "confirmed free tier" to avoid a flash of the wrong state on first paint.
  isSubscribed: boolean | null
  subscriptionTier: ProTier
  subscriptionDetails: SubscriptionDetails | null
  // False until `hydrate()` runs once on mount (see `useSubscriptionCacheSync`, mounted in
  // DashboardShell). Not currently read by consumers - `isSubscribed !== null` already tells them
  // whether a value (cached or live) is available - but kept for parity with `sidebarStore`/
  // `sortPreferencesStore`'s own hydrate-on-mount shape.
  hydrated: boolean
  // Seeds the store from the last confirmed check (see `persistSubscriptionCache`) so returning
  // users see their real tier on first paint instead of the gated UI (Sidebar's tier row, HelpDesk,
  // GoPro) popping in only once `useCheckSubscription`'s live API round trip resolves. The live
  // check still runs in the background and silently corrects this if the tier actually changed.
  // Called from a mount effect, not module init, since `localStorage` doesn't exist during Next.js's
  // SSR pass.
  hydrate: () => void
}

export const useSubscriptionStore = create<SubscriptionStore>(set => ({
  isSubscribed: null,
  subscriptionTier: null,
  subscriptionDetails: null,
  hydrated: false,
  hydrate: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        set({ ...(JSON.parse(raw) as CachedSubscription), hydrated: true })
      } else {
        set({ hydrated: true })
      }
    } catch (error) {
      console.error('Error in (subscriptionStore.hydrate) reading localStorage:', error)
      set({ hydrated: true })
    }
  },
}))

// Persists a confirmed check outcome (subscribed or not) so the next launch can hydrate from it -
// called by `applySubscriptionResult`/`clearSubscription` only, never by `resetSubscription`, since
// a sign-out-to-zero-accounts reset is an in-memory "unknown" state for the current session, not a
// real check outcome that should overwrite the cache (see `resetSubscription`'s own doc comment on
// why subscriptions are device-wide, not account-scoped).
export function persistSubscriptionCache(snapshot: CachedSubscription) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch (error) {
    console.error('Error in (persistSubscriptionCache):', error)
  }
}

// Reads the last confirmed tier straight from localStorage, bypassing the store entirely - used by
// `useSessionBootstrap`, which runs (and gates all rendering, including DashboardShell) before this
// store's own `hydrate()` ever gets a chance to run (that's only wired up via
// `useSubscriptionCacheSync`, mounted inside DashboardShell). Same "seed from last confirmed check,
// let the live check correct it later" reasoning as `hydrate()` - just callable earlier than a React
// mount effect on the store itself.
export function peekCachedSubscriptionTier() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return (JSON.parse(raw) as Partial<CachedSubscription>).subscriptionTier ?? null
    }
  } catch (error) {
    console.error('Error in (peekCachedSubscriptionTier) reading localStorage:', error)
  }
  return null
}
