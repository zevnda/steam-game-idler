import type { AccountKey } from './sessionStore'
import { create } from 'zustand'

interface ReauthModalStore {
  // Which flagged account the modal is currently re-authenticating, or null when closed - mirrors
  // addAccountModalStore's isOpen shape but keyed, since (unlike "add another account") this modal
  // always targets one specific already-known account.
  accountKey: AccountKey | null
  open: (key: AccountKey) => void
  close: () => void
}

// Drives ReauthModal, opened from an account switcher row flagged by agentReauthStore.
export const useReauthModalStore = create<ReauthModalStore>(set => ({
  accountKey: null,
  open: key => set({ accountKey: key }),
  close: () => set({ accountKey: null }),
}))
