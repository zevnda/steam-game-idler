import type { ThemeTokens } from './tokens'
import { makeTokens } from './presets'

// One-day holiday themes, applied automatically on the holiday's date and never user-selectable
// (not in `THEME_PRESETS`, so they never show in the theme picker and need no tier check - they're
// free for everyone). `resolveTheme.ts` layers one over the user's own theme for that day unless
// `Settings.disableHolidayThemes` is set.
//
// Dates are always the user's *local* calendar date (`Date`'s local getters), so a holiday starts
// and ends at the user's own midnight - see `useHolidayDetection` for the midnight rollover.
export type HolidayKey =
  'valentines' | 'lunarNewYear' | 'easter' | 'halloween' | 'christmas' | 'newYearsEve'

export const HOLIDAY_KEYS: readonly HolidayKey[] = [
  'valentines',
  'lunarNewYear',
  'easter',
  'halloween',
  'christmas',
  'newYearsEve',
]

export function isHolidayKey(value: string) {
  return (HOLIDAY_KEYS as readonly string[]).includes(value)
}

// Lunar New Year follows the lunisolar calendar (the new moon between 21 Jan and 20 Feb), which
// has no compact closed-form rule, so it's a lookup table instead. Month is 1-based here.
// TODO: extend past 2036 - until then, Lunar New Year simply doesn't trigger for later years.
const LUNAR_NEW_YEAR: Record<number, [number, number]> = {
  2026: [2, 17],
  2027: [2, 6],
  2028: [1, 26],
  2029: [2, 13],
  2030: [2, 3],
  2031: [1, 23],
  2032: [2, 11],
  2033: [1, 31],
  2034: [2, 19],
  2035: [2, 8],
  2036: [1, 28],
}

// Western (Gregorian) Easter Sunday via the anonymous Gregorian computus (Meeus/Jones/Butcher).
// Month is 1-based.
function easterSunday(year: number) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { month, day }
}

export function holidayForDate(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const is = (m: number, d: number) => month === m && day === d
  const lunar = LUNAR_NEW_YEAR[year]
  const easter = easterSunday(year)

  if (is(2, 14)) return 'valentines'
  if (lunar && is(lunar[0], lunar[1])) return 'lunarNewYear'
  if (is(easter.month, easter.day)) return 'easter'
  if (is(10, 31)) return 'halloween'
  if (is(12, 25)) return 'christmas'
  if (is(12, 31)) return 'newYearsEve'
  return null
}

// `localStorage` key `themeInitScript.ts` reads to paint a holiday on the first frame. Stores
// `<holiday>|<local YYYY-MM-DD>` so a value cached yesterday is ignored today; removed by
// `resolveTheme.ts` whenever no holiday theme is showing.
export const HOLIDAY_STORAGE_KEY = 'sgi-holiday'

// Local `YYYY-MM-DD` - what `themeInitScript.ts` compares a cached holiday against, so a holiday
// cached yesterday never paints today's first frame.
export function localDateKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export interface HolidayTheme {
  tokens: ThemeTokens
  colorScheme: 'dark' | 'light'
}

export const HOLIDAY_THEMES: Record<HolidayKey, HolidayTheme> = {
  valentines: {
    tokens: {
      ...makeTokens(5, 0.05, -0.04),
      accent: 'oklch(0.66 0.21 10)',
      accentForeground: 'var(--snow)',
    },
    colorScheme: 'dark',
  },
  lunarNewYear: {
    tokens: {
      ...makeTokens(25, 0.07, -0.06),
      accent: 'oklch(0.82 0.15 85)',
      accentForeground: 'var(--eclipse)',
    },
    colorScheme: 'dark',
  },
  // The one light holiday - a sunny spring meadow. Its shader paints an opaque sky (see
  // `ambientShaders.ts`'s output contract), so `background` mostly matters for the sidebar.
  easter: {
    tokens: {
      background: 'oklch(0.97 0.025 120)',
      fieldBackground: 'oklch(0.995 0.008 120)',
      fieldBorder: 'oklch(0.86 0.04 120)',
      surface: 'oklch(0.995 0.008 120)',
      overlay: 'oklch(0.995 0.008 120)',
      default: 'oklch(0.93 0.03 120)',
      surfaceSecondary: 'oklch(0.93 0.03 120)',
      separator: 'oklch(0.9 0.035 120)',
      border: 'oklch(0.88 0.04 120)',
      surfaceTertiary: 'oklch(0.86 0.045 120)',
      scrollbarThumb: 'oklch(0.82 0.05 120)',
      scrollbarTrack: 'transparent',
      accent: 'oklch(0.66 0.16 300)',
      accentForeground: 'var(--snow)',
    },
    colorScheme: 'light',
  },
  halloween: {
    tokens: {
      ...makeTokens(300, 0.04, -0.06),
      accent: 'oklch(0.72 0.19 50)',
      accentForeground: 'var(--eclipse)',
    },
    colorScheme: 'dark',
  },
  christmas: {
    tokens: {
      ...makeTokens(160, 0.035, -0.05),
      accent: 'oklch(0.62 0.21 25)',
      accentForeground: 'var(--snow)',
    },
    colorScheme: 'dark',
  },
  newYearsEve: {
    tokens: {
      ...makeTokens(265, 0.05, -0.07),
      accent: 'oklch(0.83 0.14 85)',
      accentForeground: 'var(--eclipse)',
    },
    colorScheme: 'dark',
  },
}
