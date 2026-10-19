import type { Settings } from '@/features/settings/types'
import type { ProTier } from '@/shared/utils/subscriptionAccess'
import { useEffect } from 'react'
import { applyThemePreset, THEME_STORAGE_KEY } from './applyTheme'
import { THEME_PRESETS } from './presets'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { invoke } from '@/shared/utils/invoke'
import { hasCasualAccess } from '@/shared/utils/subscriptionAccess'

function isGatedPreset(theme: string) {
  return theme !== 'default' && Object.hasOwn(THEME_PRESETS, theme)
}

// The preset key actually allowed to render - `default` for an unknown key or a gated preset the
// current tier doesn't cover.
function resolvePreset(theme: string, subscriptionTier: ProTier) {
  return isGatedPreset(theme) && hasCasualAccess(subscriptionTier) ? theme : 'default'
}

// Mounted once at the app root (`_app.tsx`), not `DashboardShell` - like `useZoomControls`, theme
// is an app-wide preference that should apply on the pre-dashboard sign-in screens too, not just
// `/dashboard/*`. Reconciles the pre-hydration inline script's provisional application
// (`themeInitScript.ts`, from cached `localStorage`) against the real persisted setting and
// subscription tier once both are available.
export function useTheme() {
  const isSubscribed = useSubscriptionStore(state => state.isSubscribed)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)

  useEffect(() => {
    let cancelled = false
    invoke<Settings>('get_settings')
      .then(settings => {
        if (cancelled) return
        // Tier not confirmed yet this session (`useCheckSubscription` in `DashboardShell` hasn't
        // resolved) - trust the inline script's provisional application rather than flashing to
        // `default` and back once it does resolve. Only applies to gated themes; `default` never
        // needs a tier check, so it's always safe to apply immediately.
        if (isGatedPreset(settings.theme) && isSubscribed === null) return

        const preset = resolvePreset(settings.theme, subscriptionTier)
        applyThemePreset(preset)
        localStorage.setItem(THEME_STORAGE_KEY, preset)
      })
      .catch(error => {
        console.error('Error in (get_settings) [useTheme]:', error)
      })
    return () => {
      cancelled = true
    }
  }, [isSubscribed, subscriptionTier])
}
