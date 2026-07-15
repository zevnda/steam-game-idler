import { create } from 'zustand'

interface CustomBackgroundStore {
  // Denormalized live copy of the resolved `data:` URI for `settings::Settings.custom_background`
  // - mirrors `antiAwayStore`'s "store is a plain synchronous container, the owning hook does the
  // async work" split. `null` covers both "no background set" and "not loaded yet"; `CustomBackground`
  // (mounted once in DashboardShell) hydrates this on mount, and `useCustomizationSettings`'s
  // save/clear actions update it directly so the rendered background changes immediately rather
  // than waiting for a reload.
  dataUrl: string | null
  setDataUrl: (dataUrl: string | null) => void
}

export const useCustomBackgroundStore = create<CustomBackgroundStore>(set => ({
  dataUrl: null,
  setDataUrl: dataUrl => set({ dataUrl }),
}))
