import type { Settings } from '@/features/settings/types'
import type { ProTier } from '@/shared/utils/subscriptionAccess'
import type { FontPreset } from './font'
import { useEffect } from 'react'
import { applyFont, FONT_STORAGE_KEY } from './applyFont'
import { FONT_CSS_VARS } from './font'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { invoke } from '@/shared/utils/invoke'
import { hasCasualAccess } from '@/shared/utils/subscriptionAccess'

// Mirrors `useTheme.ts`'s `isGatedPreset`/`resolveTokens` exactly, applied to fonts instead of
// theme tokens - see that file's own comment for why this is a plain boolean check rather than a
// type predicate.
function isGatedFont(font: string) {
  return font !== 'inter' && Object.hasOwn(FONT_CSS_VARS, font)
}

function resolveFont(font: string, subscriptionTier: ProTier) {
  if (!isGatedFont(font) || !hasCasualAccess(subscriptionTier)) return null
  return font as FontPreset
}

// Mounted once at the app root (`_app.tsx`, alongside `useTheme`), not `DashboardShell` - font is
// an app-wide preference that should apply on the pre-dashboard sign-in screens too. Reconciles the
// pre-hydration inline script's provisional application (`fontInitScript.ts`, from cached
// `localStorage`) against the real persisted setting and subscription tier once both are available.
export function useFont() {
  const isSubscribed = useSubscriptionStore(state => state.isSubscribed)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)

  useEffect(() => {
    let cancelled = false
    invoke<Settings>('get_settings')
      .then(settings => {
        if (cancelled) return
        // Tier not confirmed yet this session - trust the inline script's provisional application
        // rather than flashing to `inter` and back once it does resolve. Only applies to gated
        // fonts; `inter` never needs a tier check, so it's always safe to apply immediately.
        if (isGatedFont(settings.font) && isSubscribed === null) return

        const font = resolveFont(settings.font, subscriptionTier)
        applyFont(font)
        localStorage.setItem(FONT_STORAGE_KEY, font ?? 'inter')
      })
      .catch(error => {
        console.error('Error in (get_settings) [useFont]:', error)
      })
    return () => {
      cancelled = true
    }
  }, [isSubscribed, subscriptionTier])
}
