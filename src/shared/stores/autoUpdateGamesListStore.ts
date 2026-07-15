import { create } from 'zustand'

interface AutoUpdateGamesListStore {
  // Denormalized live copy of `settings::Settings.auto_update_games_list` - mirrors
  // `antiAwayStore`'s exact reasoning: `useAutoUpdateGamesListStatus` (mounted once in
  // DashboardShell) hydrates this from `get_settings` on app start and reacts to it live;
  // `GeneralSettingsTab`'s toggle calls `setEnabled` right after a successful
  // `set_auto_update_games_list` save, so flipping the switch starts/stops the interval
  // immediately rather than waiting for a reload.
  enabled: boolean
  // Denormalized live copy of `!!settings.steamWebApiKey` - decides which refresh interval
  // `useAutoUpdateGamesListStatus` uses (see that hook's own doc comment for the shared-vs-own-key
  // rate-limit reasoning). Kept here rather than re-derived per poll so the interval hook doesn't
  // need its own `get_settings` round trip on every tick - `GeneralSettingsTab`'s existing API-key
  // save/clear handlers update this the same way `handleToggleAntiAway` updates `enabled` above.
  hasCustomApiKey: boolean
  setEnabled: (enabled: boolean) => void
  setHasCustomApiKey: (hasCustomApiKey: boolean) => void
}

export const useAutoUpdateGamesListStore = create<AutoUpdateGamesListStore>(set => ({
  enabled: false,
  hasCustomApiKey: false,
  setEnabled: enabled => set({ enabled }),
  setHasCustomApiKey: hasCustomApiKey => set({ hasCustomApiKey }),
}))
