import { create } from 'zustand'

interface AchievementOrderStore {
  openGame: { appId: number; name: string } | null
  open: (appId: number, name: string) => void
  close: () => void
}

// Per-game achievement-order overlay - not a route, since static export can't do a dynamic
// `[appId]` route. Mirrors achievementManagerStore.ts's exact
// shape - a separate store rather than a shared one, since the order editor has different data
// needs (get_achievement_order/save_achievement_order/import_achievement_timings) from the
// achievements/statistics overlay, matching that store's own doc comment about not speculatively
// generalizing a `view` field ahead of a second overlay actually needing it.
export const useAchievementOrderStore = create<AchievementOrderStore>(set => ({
  openGame: null,
  open: (appId, name) => set({ openGame: { appId, name } }),
  close: () => set({ openGame: null }),
}))
