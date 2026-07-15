import { create } from 'zustand'

interface FreeGameNotificationsStore {
  // Denormalized live copy of `settings::Settings.free_game_notifications` - not the settings
  // modal's own local snapshot (useSettingsModal.ts's `settings` state, which only loads while the
  // modal is open). `useFreeGamesWatcher` (mounted once in DashboardShell) hydrates this from
  // `get_settings` on app start and reads it live on every poll tick; `FreeGamesSettingsTab`'s
  // toggle calls `setEnabled` right after a successful `set_free_game_notifications` save, so
  // flipping the switch takes effect on the very next poll rather than waiting for a reload.
  // Mirrors `antiAwayStore`'s identical split.
  enabled: boolean
  setEnabled: (enabled: boolean) => void
}

export const useFreeGameNotificationsStore = create<FreeGameNotificationsStore>(set => ({
  enabled: true,
  setEnabled: enabled => set({ enabled }),
}))
