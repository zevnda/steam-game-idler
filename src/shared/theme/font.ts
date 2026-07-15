import {
  Chakra_Petch,
  Inter,
  Lato,
  Montserrat,
  Nunito,
  Open_Sans,
  Orbitron,
  Poppins,
  Rajdhani,
  Roboto,
} from 'next/font/google'

// Self-hosted by next/font at build time (downloaded once, bundled into the app) - no runtime
// network dependency, unlike a Google Fonts CDN <link>. Every font below is exposed as a CSS
// variable (not a className) so all of them can be applied once on <Html> (_document.tsx) and
// switched between at runtime via `--font-sans` in globals.css (see `applyFont.ts`) - the whole
// point being every Casual-tier font choice is already bundled into the prod build, never fetched
// on selection.
export const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
})

export const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-open-sans',
  display: 'swap',
})

export const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-lato',
  display: 'swap',
})

export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const nunito = Nunito({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-nunito',
  display: 'swap',
})

// Angular/technical display faces, popular for gaming/esports UIs - offered alongside the
// conventional sans options above for a more "gamer" aesthetic. Still legible at UI text sizes
// (unlike a fully decorative display face), so usable app-wide via `--font-sans` like every other
// entry here, not just for headings.
export const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
})

// No 300 weight available for Orbitron on Google Fonts.
export const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-orbitron',
  display: 'swap',
})

export const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-chakra-petch',
  display: 'swap',
})

// Every next/font instance's `.variable` className, combined for `_document.tsx`'s `<Html
// className>` - all fonts must be present on <html> at all times (regardless of the active
// selection) since applyFont.ts only ever swaps which `--font-*` variable `--font-sans` points at,
// never which fonts are loaded.
export const FONT_VARIABLE_CLASSNAME = [
  inter,
  poppins,
  roboto,
  openSans,
  lato,
  montserrat,
  nunito,
  rajdhani,
  orbitron,
  chakraPetch,
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
  poppins: '--font-poppins',
  roboto: '--font-roboto',
  openSans: '--font-open-sans',
  lato: '--font-lato',
  montserrat: '--font-montserrat',
  nunito: '--font-nunito',
  rajdhani: '--font-rajdhani',
  orbitron: '--font-orbitron',
  chakraPetch: '--font-chakra-petch',
} as const

export type FontPreset = keyof typeof FONT_CSS_VARS

// Display order for the Customization settings tab's font picker, `inter` (the default) first.
export const FONT_KEYS: FontPreset[] = [
  'inter',
  'poppins',
  'roboto',
  'openSans',
  'lato',
  'montserrat',
  'nunito',
  'rajdhani',
  'orbitron',
  'chakraPetch',
]

// Display name shown in the font picker. Not run through i18n - a font's name is a brand name
// (structurally non-translatable), same carve-out `poppins` in `_document.tsx`'s className
// already relies on implicitly.
export const FONT_DISPLAY_NAMES: Record<FontPreset, string> = {
  inter: 'Inter',
  poppins: 'Poppins',
  roboto: 'Roboto',
  openSans: 'Open Sans',
  lato: 'Lato',
  montserrat: 'Montserrat',
  nunito: 'Nunito',
  rajdhani: 'Rajdhani',
  orbitron: 'Orbitron',
  chakraPetch: 'Chakra Petch',
}
