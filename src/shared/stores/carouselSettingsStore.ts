import { create } from 'zustand'

interface CarouselSettingsStore {
  // Denormalized live copies of `settings::Settings.show_*_carousel` - mirrors `antiAwayStore`'s
  // "store is a plain synchronous container, the owning hook does the async work" split. Grouped
  // into one store (not two) since both are read/written together by the same settings tab section
  // and hydration hook.
  showRecommended: boolean
  showRecent: boolean
  setShowRecommended: (value: boolean) => void
  setShowRecent: (value: boolean) => void
}

export const useCarouselSettingsStore = create<CarouselSettingsStore>(set => ({
  showRecommended: true,
  showRecent: true,
  setShowRecommended: value => set({ showRecommended: value }),
  setShowRecent: value => set({ showRecent: value }),
}))
