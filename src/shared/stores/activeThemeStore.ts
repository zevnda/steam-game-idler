import { create } from 'zustand'

interface ActiveThemeStore {
  // The preset key actually rendering right now (already tier-resolved - `default` whenever a gated
  // preset isn't allowed), written only by `applyThemePreset()`. Distinct from `Settings.theme`,
  // which is the persisted *choice* and can name a preset the current tier doesn't cover.
  preset: string
  setPreset: (preset: string) => void
}

export const useActiveThemeStore = create<ActiveThemeStore>(set => ({
  preset: 'default',
  setPreset: preset => set({ preset }),
}))
