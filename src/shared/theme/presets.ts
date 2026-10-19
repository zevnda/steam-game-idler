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
//
// `depth` shifts the whole ladder darker (negative) while keeping every step's relative gap - the
// signature presets use it so their animated backdrop (`ambientShaders.ts`) has a deeper canvas to glow
// against, without changing the elevation model itself.
export function makeTokens(hue: number, chroma: number, depth = 0) {
  const oklch = (lightness: number) =>
    `oklch(${Math.round((lightness + depth) * 1000) / 1000} ${chroma} ${hue})`
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
    overlay: 'oklch(0.1706 0.003 285.89)',
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
  // Signature presets - a surface ladder *plus* an accent override *plus* an animated WebGL backdrop
  // (`ambientShaders.ts`, rendered by `ThemeAmbient.tsx`). Adding one here without a matching
  // shader just yields a plain recolor rather than an error.
  synthwave: {
    ...makeTokens(295, 0.07, -0.03),
    accent: 'oklch(0.7 0.24 350)',
    accentForeground: 'var(--snow)',
  },
  aurora: {
    ...makeTokens(210, 0.04, -0.03),
    accent: 'oklch(0.8 0.15 170)',
    accentForeground: 'var(--eclipse)',
  },
  nebula: {
    ...makeTokens(280, 0.045, -0.05),
    accent: 'oklch(0.7 0.19 295)',
    accentForeground: 'var(--snow)',
  },
  terminal: {
    ...makeTokens(150, 0.03, -0.07),
    accent: 'oklch(0.84 0.21 145)',
    accentForeground: 'var(--eclipse)',
  },
  ember: {
    ...makeTokens(45, 0.035, -0.03),
    accent: 'oklch(0.72 0.18 48)',
    accentForeground: 'var(--eclipse)',
  },
  abyss: {
    ...makeTokens(235, 0.06, -0.05),
    accent: 'oklch(0.78 0.13 210)',
    accentForeground: 'var(--eclipse)',
  },
  // The one light signature preset - a pink-tinted mirror of `white`'s ladder (so it's also in
  // `LIGHT_THEME_PRESETS` below). Its shader paints an opaque sky over this, so `background` mostly
  // matters as the WebGL-unavailable fallback and for the solid sidebar.
  sugarDay: {
    background: 'oklch(0.96 0.02 340)',
    fieldBackground: 'oklch(0.99 0.008 340)',
    fieldBorder: 'oklch(0.86 0.04 340)',
    surface: 'oklch(0.99 0.008 340)',
    overlay: 'oklch(0.99 0.008 340)',
    default: 'oklch(0.93 0.025 340)',
    surfaceSecondary: 'oklch(0.93 0.025 340)',
    separator: 'oklch(0.9 0.03 340)',
    border: 'oklch(0.88 0.035 340)',
    surfaceTertiary: 'oklch(0.86 0.04 340)',
    scrollbarThumb: 'oklch(0.82 0.05 340)',
    scrollbarTrack: 'transparent',
    accent: 'oklch(0.68 0.18 350)',
    accentForeground: 'var(--snow)',
  },
  sugarNight: {
    ...makeTokens(310, 0.06, -0.04),
    accent: 'oklch(0.78 0.14 340)',
    accentForeground: 'var(--eclipse)',
  },
  sakura: {
    ...makeTokens(350, 0.05, -0.04),
    accent: 'oklch(0.78 0.12 355)',
    accentForeground: 'var(--eclipse)',
  },
  lofiRain: {
    ...makeTokens(250, 0.025, -0.04),
    accent: 'oklch(0.78 0.14 70)',
    accentForeground: 'var(--eclipse)',
  },
  fireflies: {
    ...makeTokens(150, 0.03, -0.06),
    accent: 'oklch(0.88 0.17 120)',
    accentForeground: 'var(--eclipse)',
  },
  holo: {
    ...makeTokens(260, 0.02, -0.05),
    accent: 'oklch(0.82 0.12 195)',
    accentForeground: 'var(--eclipse)',
  },
  blackHole: {
    ...makeTokens(60, 0.01, -0.08),
    accent: 'oklch(0.8 0.14 75)',
    accentForeground: 'var(--eclipse)',
  },
  lavaLamp: {
    ...makeTokens(10, 0.04, -0.04),
    accent: 'oklch(0.7 0.2 30)',
    accentForeground: 'var(--snow)',
  },
  circuit: {
    ...makeTokens(245, 0.04, -0.06),
    accent: 'oklch(0.72 0.17 245)',
    accentForeground: 'var(--snow)',
  },
  luxe: {
    ...makeTokens(80, 0.008, -0.08),
    accent: 'oklch(0.8 0.13 85)',
    accentForeground: 'var(--eclipse)',
  },
  arcade: {
    ...makeTokens(275, 0.04, -0.07),
    accent: 'oklch(0.86 0.2 145)',
    accentForeground: 'var(--eclipse)',
  },
} as const satisfies Record<string, ThemeTokens>

// Settings-tab swatch art for the signature presets - a plain `tokens.background` circle can't show
// what makes them different, so each gets a tiny gradient echo of its `themes.css` backdrop
// instead. Preview-only, never applied to the app itself - the real backdrop is the shader.
export const THEME_SWATCH_BACKGROUNDS: Partial<Record<ThemePreset, string>> = {
  synthwave:
    'linear-gradient(to bottom, oklch(0.18 0.07 295) 45%, oklch(0.6 0.24 350) 60%, oklch(0.78 0.16 60) 72%, oklch(0.18 0.07 295) 73%)',
  aurora:
    'radial-gradient(circle at 30% 25%, oklch(0.8 0.17 160 / 0.9), transparent 55%), radial-gradient(circle at 75% 40%, oklch(0.6 0.18 290 / 0.8), transparent 55%), oklch(0.18 0.04 210)',
  nebula:
    'radial-gradient(circle at 70% 30%, oklch(0.55 0.2 320 / 0.8), transparent 50%), radial-gradient(circle at 30% 70%, oklch(0.5 0.17 260 / 0.8), transparent 55%), radial-gradient(1px 1px at 25% 30%, white, transparent), radial-gradient(1px 1px at 60% 75%, white, transparent), oklch(0.16 0.045 280)',
  terminal:
    'repeating-linear-gradient(to bottom, oklch(0.84 0.21 145 / 0.25) 0 1px, transparent 1px 3px), radial-gradient(circle, oklch(0.4 0.12 145), oklch(0.14 0.03 150) 70%)',
  ember:
    'radial-gradient(circle at 50% 110%, oklch(0.7 0.2 40) 0%, oklch(0.5 0.2 25 / 0.6) 40%, transparent 70%), oklch(0.18 0.035 45)',
  abyss:
    'repeating-linear-gradient(105deg, transparent 0 6px, oklch(0.8 0.12 210 / 0.25) 6px 9px), linear-gradient(to bottom, oklch(0.35 0.08 225), oklch(0.13 0.06 240))',
  sugarDay:
    'radial-gradient(circle at 35% 40%, white 0 22%, transparent 24%), radial-gradient(circle at 60% 45%, white 0 18%, transparent 20%), linear-gradient(to bottom, oklch(0.92 0.05 240), oklch(0.9 0.06 300), oklch(0.9 0.07 350))',
  sugarNight:
    'radial-gradient(circle at 68% 32%, oklch(0.95 0.06 90) 0 14%, transparent 15%), radial-gradient(circle at 25% 70%, oklch(0.8 0.12 350 / 0.7), transparent 30%), linear-gradient(to bottom, oklch(0.25 0.08 300), oklch(0.2 0.07 330))',
  sakura:
    'radial-gradient(ellipse 16% 9% at 30% 35%, oklch(0.85 0.1 355), transparent), radial-gradient(ellipse 14% 8% at 65% 65%, oklch(0.8 0.12 355), transparent), radial-gradient(circle at 75% 25%, oklch(0.9 0.04 350) 0 12%, transparent 14%), oklch(0.18 0.05 350)',
  lofiRain:
    'radial-gradient(circle at 30% 70%, oklch(0.7 0.15 60 / 0.8), transparent 25%), radial-gradient(circle at 70% 60%, oklch(0.6 0.18 25 / 0.7), transparent 22%), radial-gradient(circle at 55% 25%, oklch(0.9 0.02 240) 0 5%, transparent 6%), oklch(0.18 0.025 250)',
  fireflies:
    'radial-gradient(circle at 30% 35%, oklch(0.92 0.18 120) 0 4%, transparent 14%), radial-gradient(circle at 68% 60%, oklch(0.92 0.18 120) 0 3%, transparent 12%), linear-gradient(to top, oklch(0.3 0.05 150), oklch(0.15 0.03 150))',
  holo: 'conic-gradient(from 45deg, oklch(0.8 0.15 0), oklch(0.85 0.15 90), oklch(0.85 0.13 180), oklch(0.8 0.15 270), oklch(0.8 0.15 360))',
  blackHole:
    'radial-gradient(circle, black 0 22%, oklch(0.9 0.1 80) 25%, transparent 30%), radial-gradient(ellipse 48% 12%, oklch(0.75 0.16 55) 0 70%, transparent 75%), oklch(0.12 0.01 60)',
  lavaLamp:
    'radial-gradient(circle at 40% 70%, oklch(0.7 0.2 40) 0 22%, transparent 24%), radial-gradient(circle at 62% 30%, oklch(0.6 0.22 350) 0 16%, transparent 18%), oklch(0.18 0.04 10)',
  circuit:
    'radial-gradient(circle at 50% 50%, oklch(0.75 0.15 240) 0 7%, transparent 8%), linear-gradient(oklch(0.6 0.15 245) 0 0) 50% 50% / 100% 2px no-repeat, linear-gradient(oklch(0.6 0.15 245) 0 0) 50% 50% / 2px 100% no-repeat, oklch(0.15 0.04 245)',
  luxe: 'linear-gradient(125deg, transparent 40%, oklch(0.8 0.13 85) 45%, transparent 50%, transparent 62%, oklch(0.7 0.11 85 / 0.7) 65%, transparent 68%), oklch(0.13 0.008 80)',
  arcade:
    'linear-gradient(oklch(0.86 0.2 145) 0 0) 35% 45% / 18% 18% no-repeat, linear-gradient(oklch(0.7 0.25 350) 0 0) 65% 60% / 14% 14% no-repeat, oklch(0.14 0.04 275)',
}

// Presets that need `<html data-theme>` flipped to `'light'` rather than left at `'dark'` - the
// only way HeroUI's own `--foreground` and everything derived from it (`--field-foreground`,
// `--link`, `--*-soft-foreground`, `--muted`, `--segment`, shadows) resolve to their light-mode
// values, since none of that is part of `ThemeTokens`/this app's own inline overrides. Every other
// preset keeps `data-theme='dark'` - they only ever re-tint this app's own elevation subset.
export const LIGHT_THEME_PRESETS: ReadonlySet<string> = new Set(['white', 'sugarDay'])

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
