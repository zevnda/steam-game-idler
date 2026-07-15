import { create } from 'zustand'

interface AchievementManagerStore {
  openGame: { appId: number; name: string } | null
  open: (appId: number, name: string) => void
  close: () => void
}

// Single-game achievements/statistics overlay - not a route, using the
// `{ openGame: { appId, ... } | null }` shape. Only one
// view exists today (achievements/statistics is local tab state inside the overlay itself, not
// tracked here - see that doc's reasoning), so this store doesn't carry a `view` field yet; the
// future achievement-unlocker's order editor is a separate overlay with its own data needs, not
// just another value of this same field, so there's nothing to speculatively generalize for here.
export const useAchievementManagerStore = create<AchievementManagerStore>(set => ({
  openGame: null,
  open: (appId, name) => set({ openGame: { appId, name } }),
  close: () => set({ openGame: null }),
}))
