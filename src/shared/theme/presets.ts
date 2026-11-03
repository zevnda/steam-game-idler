import type { ThemeTokens } from './tokens'

// Named theme presets, keyed by the same string persisted in `Settings.theme`
// (`src-tauri/src/settings/mod.rs`). `default` isn't a registry entry - it's `theme.css`'s
// `[data-theme='dark']` stylesheet baseline, applied by *not* setting any inline override (see
// `applyTheme(null)`). The basic colour presets below (`makeTintedTokens`) sit on `default`'s
// lightness ladder, so they differ from it in colour rather than in contrast.
export type ThemePreset = keyof typeof THEME_PRESETS

// Builds a colour theme on `default`'s own lightness ladder (`theme.css`), so every control stands
// out from the page exactly as much as it does there and only the tint changes. Chroma stays low
// because a dark colour reads far more saturated than its number suggests, and the canvas gets the
// least of it: tinting every layer equally is what makes a theme look like a colour filter, with
// inputs and buttons melting into the page. Colour comes mostly from `accent` instead.
//
// Each step is an offset from `canvas`, so a signature preset can pick a deeper canvas for its
// animated backdrop (`ambientShaders.ts`) to glow against and keep the same contrast between layers.
function makeTintedTokens(hue: number, chroma: number, canvas = 0.16) {
  const tint = (offset: number, strength = 1) =>
    `oklch(${Math.round((canvas + offset) * 1000) / 1000} ${Math.round(chroma * strength * 1000) / 1000} ${hue})`
  return {
    background: tint(0, 0.8),
    fieldBackground: tint(0.1),
    fieldBorder: 'transparent',
    surface: tint(0.05, 0.9),
    overlay: tint(0.035, 0.9),
    default: tint(0.1),
    surfaceSecondary: tint(0.1),
    separator: tint(0.055, 0.9),
    border: tint(0.07, 0.9),
    surfaceTertiary: tint(0.145),
    scrollbarThumb: tint(0.145),
    scrollbarTrack: 'transparent',
  }
}

// Every preset here is Casual-tier gated - enforced by `useTheme.ts`/`CustomizationSettingsTab.tsx`
// via `hasCasualAccess`, not by anything in this file.
export const THEME_PRESETS = {
  // No accent override: HeroUI's stock accent is already this blue.
  blue: makeTintedTokens(255, 0.032),
  // Warm enough to stay distinct from `--danger`, so a switch that's on doesn't read as an error.
  red: {
    ...makeTintedTokens(20, 0.025),
    accent: 'oklch(0.68 0.19 28)',
    accentForeground: 'var(--snow)',
  },
  purple: {
    ...makeTintedTokens(305, 0.038),
    accent: 'oklch(0.68 0.17 305)',
    accentForeground: 'var(--snow)',
  },
  pink: {
    ...makeTintedTokens(350, 0.028),
    accent: 'oklch(0.74 0.15 350)',
    accentForeground: 'var(--eclipse)',
  },
  orange: {
    ...makeTintedTokens(55, 0.022),
    accent: 'oklch(0.75 0.16 60)',
    accentForeground: 'var(--eclipse)',
  },
  // Not hue-shifted like the others - a darker, lower-chroma variant of the same neutral hue
  // `default` uses, for a true "black" theme rather than a colored one.
  black: {
    background: 'oklch(0.08 0 0)',
    fieldBackground: 'oklch(0.21 0 0)',
    fieldBorder: 'transparent',
    surface: 'oklch(0.15 0 0)',
    overlay: 'oklch(0.135 0 0)',
    default: 'oklch(0.21 0 0)',
    surfaceSecondary: 'oklch(0.21 0 0)',
    separator: 'oklch(0.155 0 0)',
    border: 'oklch(0.175 0 0)',
    surfaceTertiary: 'oklch(0.26 0 0)',
    scrollbarThumb: 'oklch(0.26 0 0)',
    scrollbarTrack: 'transparent',
  },
  // The one light-background preset - doesn't fit `makeTintedTokens`'s dark-ascending ladder shape either
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
    default: 'oklch(0.92 0.003 285.89)',
    surfaceSecondary: 'oklch(0.92 0.003 285.89)',
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
    ...makeTintedTokens(295, 0.07, 0.18),
    accent: 'oklch(0.7 0.24 350)',
    accentForeground: 'var(--snow)',
  },
  aurora: {
    ...makeTintedTokens(210, 0.04, 0.18),
    accent: 'oklch(0.8 0.15 170)',
    accentForeground: 'var(--eclipse)',
  },
  nebula: {
    ...makeTintedTokens(280, 0.045, 0.16),
    accent: 'oklch(0.7 0.19 295)',
    accentForeground: 'var(--snow)',
  },
  terminal: {
    ...makeTintedTokens(150, 0.03, 0.14),
    accent: 'oklch(0.84 0.21 145)',
    accentForeground: 'var(--eclipse)',
  },
  ember: {
    ...makeTintedTokens(45, 0.035, 0.18),
    accent: 'oklch(0.72 0.18 48)',
    accentForeground: 'var(--eclipse)',
  },
  abyss: {
    ...makeTintedTokens(235, 0.06, 0.16),
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
    default: 'oklch(0.9 0.03 340)',
    surfaceSecondary: 'oklch(0.9 0.03 340)',
    separator: 'oklch(0.9 0.03 340)',
    border: 'oklch(0.88 0.035 340)',
    surfaceTertiary: 'oklch(0.86 0.04 340)',
    scrollbarThumb: 'oklch(0.82 0.05 340)',
    scrollbarTrack: 'transparent',
    accent: 'oklch(0.68 0.18 350)',
    accentForeground: 'var(--snow)',
  },
  sugarNight: {
    ...makeTintedTokens(310, 0.06, 0.17),
    accent: 'oklch(0.78 0.14 340)',
    accentForeground: 'var(--eclipse)',
  },
  sakura: {
    ...makeTintedTokens(350, 0.05, 0.17),
    accent: 'oklch(0.78 0.12 355)',
    accentForeground: 'var(--eclipse)',
  },
  lofiRain: {
    ...makeTintedTokens(250, 0.025, 0.17),
    accent: 'oklch(0.78 0.14 70)',
    accentForeground: 'var(--eclipse)',
  },
  fireflies: {
    ...makeTintedTokens(150, 0.03, 0.15),
    accent: 'oklch(0.88 0.17 120)',
    accentForeground: 'var(--eclipse)',
  },
  holo: {
    ...makeTintedTokens(260, 0.02, 0.16),
    accent: 'oklch(0.82 0.12 195)',
    accentForeground: 'var(--eclipse)',
  },
  blackHole: {
    ...makeTintedTokens(60, 0.01, 0.13),
    accent: 'oklch(0.8 0.14 75)',
    accentForeground: 'var(--eclipse)',
  },
  lavaLamp: {
    ...makeTintedTokens(10, 0.04, 0.17),
    accent: 'oklch(0.7 0.2 30)',
    accentForeground: 'var(--snow)',
  },
  circuit: {
    ...makeTintedTokens(245, 0.04, 0.15),
    accent: 'oklch(0.72 0.17 245)',
    accentForeground: 'var(--snow)',
  },
  luxe: {
    ...makeTintedTokens(80, 0.008, 0.13),
    accent: 'oklch(0.8 0.13 85)',
    accentForeground: 'var(--eclipse)',
  },
  arcade: {
    ...makeTintedTokens(275, 0.04, 0.14),
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
  background: '#0b0c0e',
  fieldBackground: '#212328',
  fieldBorder: 'transparent',
  surface: '#16171b',
  overlay: '#131418',
  default: '#212328',
  surfaceSecondary: '#212328',
  separator: '#17181c',
  border: '#1b1c20',
  surfaceTertiary: '#2c2e34',
  scrollbarThumb: '#2c2e34',
  scrollbarTrack: 'transparent',
}
