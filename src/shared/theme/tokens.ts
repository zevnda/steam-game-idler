// The token contract every theme (a fixed preset in `presets.ts`, or - later - a Gamer-tier
// user-picked custom theme) must conform to. One key per CSS custom property `theme.css` defines
// for the `[data-theme='dark']` elevation model (see that file's own doc comment for what each
// tier means) - accent/success/warning/danger/spacing/radius stay HeroUI's stock values regardless
// of theme, matching `main`'s own minimal-touch approach to its equivalent skin system.
//
// Deliberately a plain data shape, not tied to how a theme's values are produced - `presets.ts`
// hand-writes these, a future `ColorPicker`-driven custom theme would produce the same shape from
// live user input. Both apply through the same `applyTheme()`.
export interface ThemeTokens {
  background: string
  fieldBackground: string
  fieldBorder: string
  surface: string
  overlay: string
  default: string
  surfaceSecondary: string
  separator: string
  border: string
  surfaceTertiary: string
  scrollbarThumb: string
  scrollbarTrack: string
  // Optional HeroUI accent override (switches, selected tabs, progress bars, focus rings - `--focus`
  // already resolves through `--accent`). Only the "signature" presets set these; a preset leaving
  // them out keeps HeroUI's stock blue, and `applyTheme()` clears any previous override.
  accent?: string
  accentForeground?: string
}

// camelCase key -> the actual CSS custom property name it controls. Single source of truth for
// both `applyTheme()` (writing inline styles) and the pre-hydration inline script in
// `_document.tsx` (reading this same mapping to avoid a flash of the default theme).
export const THEME_TOKEN_CSS_VARS: Record<keyof ThemeTokens, string> = {
  background: '--background',
  fieldBackground: '--field-background',
  fieldBorder: '--field-border',
  surface: '--surface',
  overlay: '--overlay',
  default: '--default',
  surfaceSecondary: '--surface-secondary',
  separator: '--separator',
  border: '--border',
  surfaceTertiary: '--surface-tertiary',
  scrollbarThumb: '--scrollbar-thumb',
  scrollbarTrack: '--scrollbar-track',
  accent: '--accent',
  accentForeground: '--accent-foreground',
}
