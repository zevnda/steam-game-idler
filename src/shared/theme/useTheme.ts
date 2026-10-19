import type { Settings } from '@/features/settings/types'
import { useEffect } from 'react'
import { isHolidayKey } from './holidays'
import {
  applyHolidayTheme,
  applyResolvedTheme,
  isGatedPreset,
  revertToCachedPreset,
} from './resolveTheme'
import { useActiveThemeStore } from '@/shared/stores/activeThemeStore'
import { useHolidayStore } from '@/shared/stores/holidayStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { invoke } from '@/shared/utils/invoke'

// Mounted once at the app root (`_app.tsx`), not `DashboardShell` - like `useZoomControls`, theme
// is an app-wide preference that should apply on the pre-dashboard sign-in screens too, not just
// `/dashboard/*`. Reconciles the pre-hydration inline script's provisional application
// (`themeInitScript.ts`, from cached `localStorage`) against the real persisted settings,
// subscription tier and today's holiday once all are available - and again whenever the holiday
// changes (the local-midnight rollover, see `useHolidayDetection`).
export function useTheme() {
  const isSubscribed = useSubscriptionStore(state => state.isSubscribed)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const holiday = useHolidayStore(state => state.holiday)

  useEffect(() => {
    let cancelled = false
    invoke<Settings>('get_settings')
      .then(settings => {
        if (cancelled) return
        useHolidayStore.getState().setDisabled(settings.disableHolidayThemes)
        const showHoliday = holiday !== null && !settings.disableHolidayThemes

        // Tier not confirmed yet this session (`useCheckSubscription` in `DashboardShell` hasn't
        // resolved) - trust the inline script's provisional application rather than flashing to
        // `default` and back once it does resolve. Only applies to gated themes; `default` never
        // needs a tier check, so it's always safe to apply immediately. A holiday needs no tier
        // check either, so it can still go up now.
        if (isGatedPreset(settings.theme) && isSubscribed === null) {
          if (showHoliday) {
            applyHolidayTheme(holiday)
          } else if (isHolidayKey(useActiveThemeStore.getState().preset)) {
            // The holiday just ended (local-midnight rollover) before the tier is known - e.g. the
            // app left on the sign-in screen overnight, where the tier check never runs. Revert to
            // the same provisional preset the inline script would paint, rather than leaving the
            // holiday up until the tier resolves; the normal path below corrects it once it does.
            revertToCachedPreset()
          }
          return
        }

        applyResolvedTheme(settings.theme, subscriptionTier, settings.disableHolidayThemes)
      })
      .catch(error => {
        console.error('Error in (get_settings) [useTheme]:', error)
      })
    return () => {
      cancelled = true
    }
  }, [isSubscribed, subscriptionTier, holiday])
}
