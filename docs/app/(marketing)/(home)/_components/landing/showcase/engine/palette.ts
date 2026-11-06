// Colour tokens for the 3D app mock, mirroring the real desktop app so the mock reads as SGI at a
// glance:
//   surface ladder      src/styles/theme.css ([data-theme='dark']) + src/shared/theme/presets.ts
//   accent              theme.css's default, or the preset's own
//   status              @heroui/styles dark theme defaults
// Everything is converted from oklch to plain rgb() up front - canvas 2D `fillStyle` support for
// oklch() is recent enough (Safari 15.4 / Firefox 113) that a marketing page shouldn't rely on it.

/** CSS oklch() -> `rgb(r g b / a)` string (gamut-clipped). L is 0-1, h in degrees. */
export function oklch(l: number, c: number, h: number, alpha = 1) {
  const [r, g, b] = oklchToRgb(l, c, h)
  return alpha >= 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`
}

export function oklchToRgb(l: number, c: number, h: number) {
  const hr = (h * Math.PI) / 180
  const a = c * Math.cos(hr)
  const b = c * Math.sin(hr)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
  return lin.map(v => {
    const x = Math.min(1, Math.max(0, v))
    const srgb = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
    return Math.round(srgb * 255)
  }) as [number, number, number]
}

export interface Palette {
  /** page canvas, sidebar and titlebar */
  background: string
  /** cards and popovers */
  surface: string
  /** every small control: buttons, inputs, dropdowns, tab strips, the active sidebar row */
  default: string
  /** a tab strip's selected segment */
  segment: string
  separator: string
  border: string
  surfaceTertiary: string
  foreground: string
  muted: string
  accent: string
  accentSoft: string
  /** text/icons on an accent fill */
  accentFg: string
  success: string
  danger: string
  /** HeroUI's `danger-soft` button: a 15% danger wash (20% hovered) with danger-tinted text */
  dangerSoft: string
  dangerSoftHover: string
  dangerSoftFg: string
  gold: string
  casual: string
  gamer: string
  /** rgb triplet of `background`, for the 3D rim/backplate tint */
  backgroundRgb: [number, number, number]
}

/** Shared, theme-independent tokens (HeroUI's stock values - the real app doesn't theme these). */
const STATUS = {
  foreground: '#fcfcfc',
  muted: oklch(0.705, 0.015, 286.067),
  success: oklch(0.7329, 0.1935, 150.81),
  danger: oklch(0.594, 0.1967, 24.63),
  dangerSoft: oklch(0.594, 0.1967, 24.63, 0.15),
  dangerSoftHover: oklch(0.594, 0.1967, 24.63, 0.2),
  // approximates `color-mix(in oklab, var(--danger) 80%, var(--foreground) 30%)`
  dangerSoftFg: oklch(0.68, 0.16, 24.63),
  gold: '#ffc700', // Sidebar.tsx's claimable free-games icon colour
  casual: oklch(0.72, 0.14, 210),
  gamer: oklch(0.55, 0.2, 300),
}

/** theme.css's default accent - HeroUI's stock blue, toned down for the darker canvas */
const DEFAULT_ACCENT: [number, number, number] = [0.63, 0.15, 254]

type Rgb = [number, number, number]
const toCss = ([r, g, b]: Rgb) => `rgb(${r} ${g} ${b})`
const hexRgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as Rgb
/** theme.css's `color-mix(in oklab, base p%, foreground)` - close enough in sRGB at these shades */
const mixToward = (base: Rgb, p: number) => base.map(v => Math.round(v * p + 252 * (1 - p))) as Rgb

/** The surface ladder, as rgb triplets; `palette()` turns it into the mock's tokens. */
interface Ladder {
  background: Rgb
  surface: Rgb
  default: Rgb
  separator: Rgb
  border: Rgb
  surfaceTertiary: Rgb
}

function palette(
  l: Ladder,
  accent: [number, number, number] = DEFAULT_ACCENT,
  darkOnAccent = false,
) {
  const p: Palette = {
    ...STATUS,
    background: toCss(l.background),
    surface: toCss(l.surface),
    default: toCss(l.default),
    segment: toCss(mixToward(l.default, 0.88)),
    separator: toCss(l.separator),
    border: toCss(l.border),
    surfaceTertiary: toCss(l.surfaceTertiary),
    accent: oklch(...accent),
    accentSoft: oklch(...accent, 0.16),
    accentFg: darkOnAccent ? '#0b0c0e' : '#fcfcfc',
    backgroundRgb: l.background,
  }
  return p
}

/** theme.css's `[data-theme='dark']` baseline - the default theme */
const DEFAULT_LADDER: Ladder = {
  background: hexRgb('#0b0c0e'),
  surface: hexRgb('#16171b'),
  default: hexRgb('#212328'),
  separator: hexRgb('#17181c'),
  border: hexRgb('#1b1c20'),
  surfaceTertiary: hexRgb('#2c2e34'),
}

/** presets.ts's `makeTintedTokens(hue, chroma)`: default's lightness ladder, tinted */
function tinted(hue: number, chroma: number, canvas = 0.16) {
  const tint = (offset: number, strength = 1) => oklchToRgb(canvas + offset, chroma * strength, hue)
  const ladder: Ladder = {
    background: tint(0, 0.8),
    surface: tint(0.05, 0.9),
    default: tint(0.1),
    separator: tint(0.055, 0.9),
    border: tint(0.07, 0.9),
    surfaceTertiary: tint(0.145),
  }
  return ladder
}

export type ThemeId = 'default' | 'blue' | 'red' | 'purple' | 'pink' | 'orange' | 'black'

/**
 * The dark presets from src/shared/theme/presets.ts. `white` is left out on purpose - it also
 * flips HeroUI's foreground tokens, which this simplified mock doesn't model.
 */
export const THEMES: Record<ThemeId, { label: string; swatch: string; palette: Palette }> = {
  default: {
    label: 'Default',
    swatch: oklch(0.36, 0.006, 285.89),
    palette: palette(DEFAULT_LADDER),
  },
  blue: { label: 'Blue', swatch: oklch(0.5, 0.12, 250), palette: palette(tinted(255, 0.032)) },
  red: {
    label: 'Red',
    swatch: oklch(0.5, 0.14, 25),
    palette: palette(tinted(20, 0.025), [0.67, 0.15, 28]),
  },
  purple: {
    label: 'Purple',
    swatch: oklch(0.5, 0.13, 300),
    palette: palette(tinted(305, 0.038), [0.68, 0.135, 305]),
  },
  pink: {
    label: 'Pink',
    swatch: oklch(0.52, 0.13, 340),
    palette: palette(tinted(350, 0.028), [0.74, 0.12, 350], true),
  },
  orange: {
    label: 'Orange',
    swatch: oklch(0.55, 0.12, 40),
    palette: palette(tinted(55, 0.022), [0.75, 0.13, 60], true),
  },
  black: {
    label: 'Black',
    swatch: oklch(0.2, 0.003, 285.89),
    palette: palette({
      background: oklchToRgb(0.08, 0, 0),
      surface: oklchToRgb(0.15, 0, 0),
      default: oklchToRgb(0.21, 0, 0),
      separator: oklchToRgb(0.155, 0, 0),
      border: oklchToRgb(0.175, 0, 0),
      surfaceTertiary: oklchToRgb(0.26, 0, 0),
    }),
  },
}
