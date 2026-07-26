import {
  Audiowide,
  Black_Ops_One as BlackOpsOne,
  Bungee,
  Cinzel_Decorative as CinzelDecorative,
  Inter,
  Michroma,
  Monoton,
  Montserrat,
  Orbitron,
  Silkscreen,
  Zen_Dots as ZenDots,
} from 'next/font/google'

// Self-hosted by next/font at build time (downloaded once, bundled into the app) - no runtime
// network dependency, unlike a Google Fonts CDN <link>. Every font below is exposed as a CSS
// variable (not a className) so all of them can be applied once on <Html> (_document.tsx) and
// switched between at runtime via `--font-sans` in globals.css (see `applyFont.ts`) - the whole
// point being every Casual-tier font choice is already bundled into the prod build, never fetched
// on selection.
export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

// Futuristic sci-fi HUD font. Only ships weight 400.
export const audiowide = Audiowide({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-audiowide',
  display: 'swap',
})

// Military stencil font. Only ships weight 400.
export const blackOpsOne = BlackOpsOne({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-black-ops-one',
  display: 'swap',
})

// Chunky rounded graffiti-style display font. Only ships weight 400.
export const bungee = Bungee({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bungee',
  display: 'swap',
})

// Ornate engraved/carved-stone display font. Only ships weight 400, 700, 900.
export const cinzelDecorative = CinzelDecorative({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-cinzel-decorative',
  display: 'swap',
})

// Wide futuristic tech font. Only ships weight 400.
export const michroma = Michroma({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-michroma',
  display: 'swap',
})

// Neon-tube sign display font. Only ships weight 400.
export const monoton = Monoton({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-monoton',
  display: 'swap',
})

export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
})

// No 300 weight available for Orbitron on Google Fonts.
export const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-orbitron',
  display: 'swap',
})

// Crisp pixel font. Only ships weight 400 and 700.
export const silkscreen = Silkscreen({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-silkscreen',
  display: 'swap',
})

// Playful geometric dot-matrix display font. Only ships weight 400.
export const zenDots = ZenDots({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-zen-dots',
  display: 'swap',
})

// Every next/font instance's `.variable` className, combined for `_document.tsx`'s `<Html
// className>` - all fonts must be present on <html> at all times (regardless of the active
// selection) since applyFont.ts only ever swaps which `--font-*` variable `--font-sans` points at,
// never which fonts are loaded.
export const FONT_VARIABLE_CLASSNAME = [
  inter,
  audiowide,
  blackOpsOne,
  bungee,
  cinzelDecorative,
  michroma,
  monoton,
  montserrat,
  orbitron,
  silkscreen,
  zenDots,
]
  .map(font => font.variable)
  .join(' ')

// Font keys persisted in `Settings.font` (`src-tauri/src/settings/mod.rs`), mapped to the CSS
// variable each next/font instance above was given. `inter` is the free-tier default - not
// special-cased out of this map the way `THEME_PRESETS` excludes `default` (see `presets.ts`),
// since there's no separate stylesheet baseline to fall back to here: globals.css's own
// `--font-sans` default already points at `--font-inter` directly. Every other key (including
// `poppins`, the previous default) is a Casual-tier selectable override.
export const FONT_CSS_VARS = {
  inter: '--font-inter',
  audiowide: '--font-audiowide',
  blackOpsOne: '--font-black-ops-one',
  bungee: '--font-bungee',
  cinzelDecorative: '--font-cinzel-decorative',
  michroma: '--font-michroma',
  monoton: '--font-monoton',
  montserrat: '--font-montserrat',
  orbitron: '--font-orbitron',
  silkscreen: '--font-silkscreen',
  zenDots: '--font-zen-dots',
} as const

export type FontPreset = keyof typeof FONT_CSS_VARS

// Display order for the Customization settings tab's font picker - `inter` (the default) first,
// then every other font alphabetical by display name.
export const FONT_KEYS: FontPreset[] = [
  'inter',
  'audiowide',
  'blackOpsOne',
  'bungee',
  'cinzelDecorative',
  'michroma',
  'monoton',
  'montserrat',
  'orbitron',
  'silkscreen',
  'zenDots',
]

// Display name shown in the font picker. Not run through i18n - a font's name is a brand name
// (structurally non-translatable), same carve-out `poppins` in `_document.tsx`'s className
// already relies on implicitly.
export const FONT_DISPLAY_NAMES: Record<FontPreset, string> = {
  inter: 'Inter (default)',
  audiowide: 'Audiowide',
  blackOpsOne: 'Black Ops One',
  bungee: 'Bungee',
  cinzelDecorative: 'Cinzel Decorative',
  michroma: 'Michroma',
  monoton: 'Monoton',
  montserrat: 'Montserrat',
  orbitron: 'Orbitron',
  silkscreen: 'Silkscreen',
  zenDots: 'Zen Dots',
}

// Per-font visual size correction, multiplied into every Tailwind `--text-*` token (see
// globals.css's `@theme` block) via `--font-size-scale` - some display fonts (pixel fonts
// especially) render noticeably larger than their nominal font-size at the same rem value, so a
// flat font swap alone leaves them looking oversized next to every other font. Only list an entry
// here for a font that actually needs correcting; `applyFont.ts`/`fontInitScript.ts` fall back to
// `1` (no-op) for any key missing from this map, so most fonts don't need one.
export const FONT_SIZE_SCALE: Partial<Record<FontPreset, number>> = {
  bungee: 0.9,
  cinzelDecorative: 0.9,
  michroma: 0.9,
  monoton: 0.9,
  orbitron: 0.95,
  silkscreen: 0.9,
  zenDots: 0.9,
}
