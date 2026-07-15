import { create } from 'zustand'

interface DisableTooltipsStore {
  // Denormalized live copy of `settings::Settings.disable_tooltips` - mirrors `antiAwayStore`'s
  // "store is a plain synchronous container, the owning hook does the async work" split.
  // `useDisableTooltipsSync` (mounted once in DashboardShell) hydrates this on mount;
  // `useCustomizationSettings`'s save action writes it directly so every `AppTooltip.Root` in the
  // tree reacts immediately, not just after a reload.
  disabled: boolean
  setDisabled: (disabled: boolean) => void
}

export const useDisableTooltipsStore = create<DisableTooltipsStore>(set => ({
  disabled: false,
  setDisabled: disabled => set({ disabled }),
}))
