import { create } from 'zustand'

interface AntiAwayStore {
  // Denormalized live copy of `settings::Settings.anti_away` - not the settings modal's own local
  // snapshot (useSettingsModal.ts's `settings` state, which only loads while the modal is open).
  // `useAntiAwayStatus` (mounted once in DashboardShell) hydrates this from `get_settings` on app
  // start and reacts to it live; `GeneralSettingsTab`'s toggle calls `setEnabled` right after a
  // successful `set_anti_away` save, so flipping the switch starts/stops the interval immediately
  // rather than waiting for a reload. Mirrors cardFarmingStore/idlingStore's "store is a plain
  // synchronous state container, the owning hook does the async work" split.
  enabled: boolean
  setEnabled: (enabled: boolean) => void
}

export const useAntiAwayStore = create<AntiAwayStore>(set => ({
  enabled: false,
  setEnabled: enabled => set({ enabled }),
}))
