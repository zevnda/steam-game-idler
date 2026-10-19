import type { ProTier } from '@/shared/utils/subscriptionAccess'
import type { HolidayKey } from './holidays'
import { applyTheme, applyThemePreset, THEME_STORAGE_KEY } from './applyTheme'
import { HOLIDAY_STORAGE_KEY, HOLIDAY_THEMES, localDateKey } from './holidays'
import { THEME_PRESETS } from './presets'
import { useActiveThemeStore } from '@/shared/stores/activeThemeStore'
import { useHolidayStore } from '@/shared/stores/holidayStore'
import { hasCasualAccess } from '@/shared/utils/subscriptionAccess'

export function isGatedPreset(theme: string) {
  return theme !== 'default' && Object.hasOwn(THEME_PRESETS, theme)
}

// The user's own preset key actually allowed to render - `default` for an unknown key or a gated
// preset the current tier doesn't cover.
export function resolveUserPreset(theme: string, subscriptionTier: ProTier) {
  return isGatedPreset(theme) && hasCasualAccess(subscriptionTier) ? theme : 'default'
}

// Exported on its own for `useTheme`'s tier-not-yet-known path, where the holiday can already be
// shown but the user's own preset can't be resolved (or cached) yet.
export function applyHolidayTheme(holiday: HolidayKey) {
  const { tokens, colorScheme } = HOLIDAY_THEMES[holiday]
  applyTheme(tokens, colorScheme)
  useActiveThemeStore.getState().setPreset(holiday)
  localStorage.setItem(HOLIDAY_STORAGE_KEY, `${holiday}|${localDateKey(new Date())}`)
}

// The single place deciding what actually renders: today's holiday theme (free for everyone)
// layered over the user's own theme, unless they've opted out - otherwise their own preset after
// tier gating. Every caller that changes any input (settings load, theme picker, the holiday
// toggle, a settings reset, the midnight rollover via `useTheme`) goes through this, so the two
// can never disagree about which one wins.
export function applyResolvedTheme(
  userTheme: string,
  subscriptionTier: ProTier,
  holidaysDisabled: boolean,
) {
  const userPreset = resolveUserPreset(userTheme, subscriptionTier)
  // Cached even while a holiday covers it, so tomorrow's first frame paints the right theme.
  localStorage.setItem(THEME_STORAGE_KEY, userPreset)

  const holiday = useHolidayStore.getState().holiday
  if (holiday && !holidaysDisabled) {
    applyHolidayTheme(holiday)
  } else {
    applyThemePreset(userPreset)
    localStorage.removeItem(HOLIDAY_STORAGE_KEY)
  }
}

// Drops a holiday theme in favor of the last cached user preset, without needing the tier -
// `useTheme`'s rollover fallback for when the tier isn't known yet. The cached key was already
// tier-resolved when it was written (see `applyResolvedTheme`), so it's the same provisional
// choice `themeInitScript.ts` would make on a fresh launch.
export function revertToCachedPreset() {
  applyThemePreset(localStorage.getItem(THEME_STORAGE_KEY) ?? 'default')
  localStorage.removeItem(HOLIDAY_STORAGE_KEY)
}
