import type { ProTier } from '@/shared/utils/subscriptionAccess'
import { create } from 'zustand'

interface ProModalStore {
  isOpen: boolean
  // Which tier a gated feature's upsell required when it opened the modal - `null` for the plain
  // titlebar-button open (nothing specific to scroll to/highlight). Reset to `null` on close so a
  // stale highlight never leaks into the next open. See GoProModal/index.tsx's `tierRef` effect and
  // TierCard's `isRequired` prop for how this is consumed.
  requiredTier: ProTier
  open: () => void
  openWithTier: (tier: ProTier) => void
  close: () => void
}

// Backs the titlebar Go Pro button's modal (see GoPro.tsx) and every gated-feature upsell
// (GoProModal/index.tsx auto-scrolls to and highlights `requiredTier` when set).
export const useProModalStore = create<ProModalStore>(set => ({
  isOpen: false,
  requiredTier: null,
  open: () => set({ isOpen: true, requiredTier: null }),
  openWithTier: tier => set({ isOpen: true, requiredTier: tier }),
  close: () => set({ isOpen: false, requiredTier: null }),
}))
