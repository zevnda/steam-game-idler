import type { HolidayKey } from './holidays'
import { useEffect } from 'react'
import { holidayForDate, isHolidayKey } from './holidays'
import { useHolidayStore } from '@/shared/stores/holidayStore'
import { logFrontendInfo } from '@/shared/utils/frontendLogging'

// Dev-only preview: `localStorage.setItem('sgi-debug-holiday', 'halloween')` then reload, to see a
// holiday without waiting for its date. Ignored in production builds, so a real user can never
// pick a holiday theme by hand ("not selectable" is a product requirement, not just UI).
const DEBUG_OVERRIDE_KEY = 'sgi-debug-holiday'

function detectHoliday() {
  if (process.env.NODE_ENV === 'development') {
    try {
      const override = localStorage.getItem(DEBUG_OVERRIDE_KEY)
      if (override && isHolidayKey(override)) return override as HolidayKey
    } catch {
      // Storage unavailable - fall through to the real date.
    }
  }
  return holidayForDate(new Date())
}

function msUntilNextLocalMidnight() {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  // +1s so the re-check lands safely on the new day rather than racing the boundary.
  return next.getTime() - now.getTime() + 1000
}

// Root-mounted (`_app.tsx`), like `useTheme` - keeps `holidayStore.holiday` matching the user's
// local date. Re-checks at local midnight (so a holiday starts/ends on time for an app left
// running) and on window focus (a sleeping machine can sleep straight through the midnight timer,
// and the user may have changed timezone while away).
export function useHolidayDetection() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    const check = () => {
      const holiday = detectHoliday()
      const store = useHolidayStore.getState()
      if (store.holiday !== holiday) {
        store.setHoliday(holiday)
        logFrontendInfo('useHolidayDetection', 'holiday changed', { holiday })
      }
    }

    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        check()
        schedule()
      }, msUntilNextLocalMidnight())
    }

    const handleFocus = () => {
      check()
      schedule()
    }

    check()
    schedule()
    window.addEventListener('focus', handleFocus)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])
}
