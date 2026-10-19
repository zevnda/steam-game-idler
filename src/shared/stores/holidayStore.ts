import type { HolidayKey } from '@/shared/theme/holidays'
import { create } from 'zustand'

interface HolidayStore {
  // Today's holiday by the user's local date (or a dev override, see `useHolidayDetection`),
  // regardless of whether its theme is actually showing - `Settings → Customization` uses this to
  // decide whether the opt-out toggle appears at all.
  holiday: HolidayKey | null
  setHoliday: (holiday: HolidayKey | null) => void
  // Mirror of `Settings.disableHolidayThemes`, hydrated by `useTheme` and written by the
  // customization tab's toggle after a successful save.
  disabled: boolean
  setDisabled: (disabled: boolean) => void
}

export const useHolidayStore = create<HolidayStore>(set => ({
  holiday: null,
  setHoliday: holiday => set({ holiday }),
  disabled: false,
  setDisabled: disabled => set({ disabled }),
}))
