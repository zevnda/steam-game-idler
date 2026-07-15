import type { Settings } from '@/features/settings/types'
import type { ProTier } from '@/shared/utils/subscriptionAccess'
import type { ThemePreset } from './presets'
import { useEffect } from 'react'
import { applyTheme, THEME_STORAGE_KEY } from './applyTheme'
import { isLightThemePreset, THEME_PRESETS } from './presets'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { invoke } from '@/shared/utils/invoke'
import { hasCasualAccess } from '@/shared/utils/subscriptionAccess'

// Deliberately a plain boolean check, not a `key is ThemePreset` type predicate - this project's
// lint config forbids explicit return-type annotations on function declarations, which a predicate
// requires. `resolveTokens` below narrows with an `as ThemePreset` cast instead, justified by this
// same check having just run.
function isGatedPreset(theme: string) {
  return theme !== 'default' && Object.hasOwn(THEME_PRESETS, theme)
}

function resolveTokens(theme: string, subscriptionTier: ProTier) {
  if (!isGatedPreset(theme) || !hasCasualAccess(subscriptionTier)) return null
  return THEME_PRESETS[theme as ThemePreset]
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

        const tokens = resolveTokens(settings.theme, subscriptionTier)
        applyTheme(tokens, tokens && isLightThemePreset(settings.theme) ? 'light' : 'dark')
        localStorage.setItem(THEME_STORAGE_KEY, tokens ? settings.theme : 'default')
      })
      .catch(error => {
        console.error('Error in (get_settings) [useTheme]:', error)
      })
    return () => {
      cancelled = true
    }
  }, [isSubscribed, subscriptionTier])
}
