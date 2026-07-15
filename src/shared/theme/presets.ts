import type { ThemeTokens } from './tokens'

// Named theme presets, keyed by the same string persisted in `Settings.theme`
// (`src-tauri/src/settings/mod.rs`). `default` isn't a registry entry - it's `theme.css`'s
// `[data-theme='dark']` stylesheet baseline, applied by *not* setting any inline override (see
// `applyTheme(null)`). All Pro-gated presets below reuse `default`'s exact lightness ladder (same
// oklch L values `theme.css` already defines) so every theme keeps the same elevation model - only
// hue/chroma shift, which is what makes them read as distinct color themes rather than different
// contrast levels.
export type ThemePreset = keyof typeof THEME_PRESETS

// Builds one preset's full token set from a single hue + chroma, so adding theme #7 tomorrow is
// one `makeTokens(hue, chroma)` call, not twelve hand-written oklch strings. `black` is the one
// preset that doesn't fit this shape (a darker, near-neutral ladder rather than a hue-shifted
// one), so it's hand-written separately below.
function makeTokens(hue: number, chroma: number) {
  const oklch = (lightness: number) => `oklch(${lightness} ${chroma} ${hue})`
  return {
    background: oklch(0.21),
    fieldBackground: oklch(0.24),
    fieldBorder: oklch(0.4),
    surface: oklch(0.28),
    overlay: oklch(0.28),
    default: oklch(0.33),
    surfaceSecondary: oklch(0.33),
    separator: oklch(0.31),
    border: oklch(0.36),
    surfaceTertiary: oklch(0.4),
    scrollbarThumb: oklch(0.4),
    scrollbarTrack: 'transparent',
  }
}

// Every preset here is Casual-tier gated - enforced by `useTheme.ts`/`CustomizationSettingsTab.tsx`
// via `hasCasualAccess`, not by anything in this file.
export const THEME_PRESETS = {
  blue: makeTokens(250, 0.06),
  red: makeTokens(25, 0.08),
  purple: makeTokens(300, 0.07),
  pink: makeTokens(340, 0.07),
  orange: makeTokens(40, 0.06),
  // Not hue-shifted like the others - a darker, lower-chroma variant of the same neutral hue
  // `default` uses, for a true "black" theme rather than a colored one.
  black: {
    background: 'oklch(0.14 0.003 285.89)',
    fieldBackground: 'oklch(0.2329 0.003 285.89)',
    fieldBorder: 'oklch(0.32 0.003 285.89)',
    surface: 'oklch(0.19 0.003 285.89)',
    overlay: 'oklch(0.19 0.003 285.89)',
    default: 'oklch(0.24 0.003 285.89)',
    surfaceSecondary: 'oklch(0.24 0.003 285.89)',
    separator: 'oklch(0.22 0.003 285.89)',
    border: 'oklch(0.27 0.003 285.89)',
    surfaceTertiary: 'oklch(0.32 0.003 285.89)',
    scrollbarThumb: 'oklch(0.32 0.003 285.89)',
    scrollbarTrack: 'transparent',
  },
  // The one light-background preset - doesn't fit `makeTokens`'s dark-ascending ladder shape either
  // (an inverted mirror of `black`, not a hue shift). `ThemeTokens` only carries this app's own
  // elevation subset; HeroUI's own `--foreground`/`--field-foreground`/`--link`/shadow tokens still
  // need to flip to its light values for text to stay readable, which no entry in this file can do
  // alone - see `LIGHT_THEME_PRESETS`/`isLightThemePreset` below, consumed by `applyTheme()`'s
  // `colorScheme` param to also flip `<html>`'s `data-theme` attribute.
  white: {
    background: 'oklch(0.97 0.002 285.89)',
    fieldBackground: 'oklch(1 0 0)',
    fieldBorder: 'oklch(0.84 0.004 285.89)',
    surface: 'oklch(1 0 0)',
    overlay: 'oklch(1 0 0)',
    default: 'oklch(0.94 0.002 285.89)',
    surfaceSecondary: 'oklch(0.94 0.002 285.89)',
    separator: 'oklch(0.91 0.003 285.89)',
    border: 'oklch(0.89 0.003 285.89)',
    surfaceTertiary: 'oklch(0.84 0.004 285.89)',
    scrollbarThumb: 'oklch(0.84 0.004 285.89)',
    scrollbarTrack: 'transparent',
  },
} as const satisfies Record<string, ThemeTokens>

// Presets that need `<html data-theme>` flipped to `'light'` rather than left at `'dark'` - the
// only way HeroUI's own `--foreground` and everything derived from it (`--field-foreground`,
// `--link`, `--*-soft-foreground`, `--muted`, `--segment`, shadows) resolve to their light-mode
// values, since none of that is part of `ThemeTokens`/this app's own inline overrides. Every other
// preset keeps `data-theme='dark'` - they only ever re-tint this app's own elevation subset.
export const LIGHT_THEME_PRESETS: ReadonlySet<string> = new Set(['white'])

export function isLightThemePreset(theme: string) {
  return LIGHT_THEME_PRESETS.has(theme)
}

// `default`'s own token values, purely for rendering its swatch preview in
// `CustomizationSettingsTab.tsx` (it has no `THEME_PRESETS` entry - see this file's header comment
// for why). Must stay in sync with `theme.css`'s `[data-theme='dark']` block by hand; not consumed
// by `applyTheme`/`useTheme.ts`, only by the settings-tab preview swatch.
export const DEFAULT_THEME_PREVIEW_TOKENS: ThemeTokens = {
  background: 'oklch(0.21 0.006 285.89)',
  fieldBackground: 'oklch(0.24 0.006 285.89)',
  fieldBorder: 'oklch(0.4 0.006 285.89)',
  surface: 'oklch(0.28 0.006 285.89)',
  overlay: 'oklch(0.28 0.006 285.89)',
  default: 'oklch(0.33 0.006 285.89)',
  surfaceSecondary: 'oklch(0.33 0.006 285.89)',
  separator: 'oklch(0.31 0.006 285.89)',
  border: 'oklch(0.36 0.006 285.89)',
  surfaceTertiary: 'oklch(0.4 0.006 285.89)',
  scrollbarThumb: 'oklch(0.4 0.006 285.89)',
  scrollbarTrack: 'transparent',
}
