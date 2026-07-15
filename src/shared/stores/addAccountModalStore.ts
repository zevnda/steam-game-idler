import { create } from 'zustand'

interface AddAccountModalStore {
  isOpen: boolean
  open: () => void
  close: () => void
}

// Fully decoupled from routing, same reasoning as settingsModalStore.ts - drives AddAccountModal,
// opened from the account switcher's "+ Add another account" row.
export const useAddAccountModalStore = create<AddAccountModalStore>(set => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
