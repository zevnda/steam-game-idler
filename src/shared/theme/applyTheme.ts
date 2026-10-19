import type { ThemePreset } from './presets'
import type { ThemeTokens } from './tokens'
import { isLightThemePreset, THEME_PRESETS } from './presets'
import { THEME_TOKEN_CSS_VARS } from './tokens'
import { useActiveThemeStore } from '@/shared/stores/activeThemeStore'

// `localStorage` key the pre-hydration inline script in `_document.tsx` reads synchronously (and
// `useTheme.ts` keeps current) so the first paint already shows the right theme instead of
// flashing `default` before the async settings load resolves. Stores a `ThemePreset` key, not the
// resolved tokens - see that script for why a key lookup is enough for named presets.
export const THEME_STORAGE_KEY = 'sgi-theme'

// Writes (or clears) every theme token as an inline custom property on `<html>`. Inline styles win
// over `theme.css`'s stylesheet rules unconditionally, so applying/un-applying a theme never needs
// the cascade-layer trick `theme.css` itself uses to beat HeroUI's own defaults.
//
// `tokens: null` is the `default` case - clears any previously-applied override so the element
// falls back to `theme.css`'s own `[data-theme='dark']` values, rather than writing `default`'s
// values out twice (once in the stylesheet, once here). This is also exactly the shape a future
// Gamer-tier custom color picker would call this with (a live `ThemeTokens` object instead of one
// looked up from `presets.ts`).
//
// `colorScheme` flips `<html>`'s `data-theme` attribute (defaults to `'dark'`, this app's baseline)
// so HeroUI's own `--foreground` and everything derived from it resolve to the right light/dark
// values - `ThemeTokens`/the loop below only ever cover this app's own elevation-token subset, see
// `presets.ts`'s `LIGHT_THEME_PRESETS` doc comment for why that split exists.
export function applyTheme(tokens: ThemeTokens | null, colorScheme: 'dark' | 'light' = 'dark') {
  const root = document.documentElement
  root.dataset.theme = colorScheme
  for (const key of Object.keys(THEME_TOKEN_CSS_VARS) as (keyof ThemeTokens)[]) {
    const cssVar = THEME_TOKEN_CSS_VARS[key]
    // Per-key check (not just `tokens`) - optional tokens like `accent` must be cleared when the
    // newly-applied preset doesn't set them, or a previous signature preset's accent would linger.
    const value = tokens?.[key]
    if (value) {
      root.style.setProperty(cssVar, value)
    } else {
      root.style.removeProperty(cssVar)
    }
  }
}

// Applies a named preset end to end - tokens, light/dark scheme, and `activeThemeStore` (which
// `ThemeAmbient.tsx` reads to pick a signature preset's animated backdrop). Callers must resolve
// tier gating first (pass `'default'` for an account without access); an unknown key also falls
// back to `default`.
export function applyThemePreset(theme: string) {
  const tokens = Object.hasOwn(THEME_PRESETS, theme) ? THEME_PRESETS[theme as ThemePreset] : null
  applyTheme(tokens, tokens && isLightThemePreset(theme) ? 'light' : 'dark')
  useActiveThemeStore.getState().setPreset(tokens ? theme : 'default')
}
