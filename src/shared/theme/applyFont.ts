import type { FontPreset } from './font'
import { FONT_CSS_VARS } from './font'

// `localStorage` key the pre-hydration inline script in `_document.tsx` reads synchronously (and
// `useFont.ts` keeps current) so the first paint already shows the right font instead of flashing
// `inter` before the async settings load resolves. Mirrors `applyTheme.ts`'s `THEME_STORAGE_KEY`
// exactly.
export const FONT_STORAGE_KEY = 'sgi-font'

// Writes (or clears) `--font-sans`'s inline override on `<html>`. Inline styles win over
// globals.css's stylesheet rule unconditionally, same as `applyTheme.ts`.
//
// `font: null` (or `'inter'`) is the default case - clears any previously-applied override so
// the element falls back to globals.css's own `--font-sans` baseline (which already points at
// `--font-inter`), rather than writing inter's var out a second time.
export function applyFont(font: FontPreset | null) {
  const root = document.documentElement
  if (font && font !== 'inter') {
    root.style.setProperty(
      '--font-sans',
      `var(${FONT_CSS_VARS[font]}), ui-sans-serif, system-ui, sans-serif`,
    )
  } else {
    root.style.removeProperty('--font-sans')
  }
}
