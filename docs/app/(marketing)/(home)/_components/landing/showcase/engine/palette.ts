// Colour tokens for the 3D app mock, mirroring the real desktop app so the mock reads as SGI at a
// glance:
//   surface ladder      src/styles/theme.css ([data-theme='dark']) + src/shared/theme/presets.ts
//   accent/status       @heroui/styles dark theme defaults
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
  background: string
  surface: string
  default: string
  separator: string
  border: string
  surfaceTertiary: string
  foreground: string
  muted: string
  accent: string
  accentSoft: string
  success: string
  danger: string
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
  accent: oklch(0.6204, 0.195, 253.83),
  accentSoft: oklch(0.6204, 0.195, 253.83, 0.16),
  success: oklch(0.7329, 0.1935, 150.81),
  danger: oklch(0.594, 0.1967, 24.63),
  gold: '#ffc700', // Sidebar.tsx's claimable free-games icon colour
  casual: oklch(0.72, 0.14, 210),
  gamer: oklch(0.55, 0.2, 300),
}

/** presets.ts's `makeTokens(hue, chroma)` lightness ladder (theme.css's default L values). */
const LADDER = {
  background: 0.21,
  surface: 0.28,
  default: 0.33,
  separator: 0.31,
  border: 0.36,
  surfaceTertiary: 0.4,
}

function ladder(hue: number, chroma: number, l = LADDER) {
  const palette: Palette = {
    ...STATUS,
    background: oklch(l.background, chroma, hue),
    surface: oklch(l.surface, chroma, hue),
    default: oklch(l.default, chroma, hue),
    separator: oklch(l.separator, chroma, hue),
    border: oklch(l.border, chroma, hue),
    surfaceTertiary: oklch(l.surfaceTertiary, chroma, hue),
    backgroundRgb: oklchToRgb(l.background, chroma, hue),
  }
  return palette
}

export type ThemeId = 'default' | 'blue' | 'red' | 'purple' | 'pink' | 'orange' | 'black'

/**
 * The dark presets from src/shared/theme/presets.ts. `white` is left out on purpose - it also
 * flips HeroUI's foreground tokens, which this simplified mock doesn't model.
 */
export const THEMES: Record<ThemeId, { label: string; swatch: string; palette: Palette }> = {
  default: { label: 'Default', swatch: oklch(0.36, 0.006, 285.89), palette: ladder(285.89, 0.006) },
  blue: { label: 'Blue', swatch: oklch(0.5, 0.12, 250), palette: ladder(250, 0.06) },
  red: { label: 'Red', swatch: oklch(0.5, 0.14, 25), palette: ladder(25, 0.08) },
  purple: { label: 'Purple', swatch: oklch(0.5, 0.13, 300), palette: ladder(300, 0.07) },
  pink: { label: 'Pink', swatch: oklch(0.52, 0.13, 340), palette: ladder(340, 0.07) },
  orange: { label: 'Orange', swatch: oklch(0.55, 0.12, 40), palette: ladder(40, 0.06) },
  black: {
    label: 'Black',
    swatch: oklch(0.2, 0.003, 285.89),
    palette: ladder(285.89, 0.003, {
      background: 0.14,
      surface: 0.19,
      default: 0.24,
      separator: 0.22,
      border: 0.27,
      surfaceTertiary: 0.32,
    }),
  },
}
