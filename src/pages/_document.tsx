import { Head, Html, Main, NextScript } from 'next/document'
import { FONT_VARIABLE_CLASSNAME } from '@/shared/theme/font'
import { buildFontInitScript } from '@/shared/theme/fontInitScript'
import { buildThemeInitScript } from '@/shared/theme/themeInitScript'

// Static fallback is `data-theme="dark"` - every preset except `white` is a dark-background variant
// (see `presets.ts`'s `LIGHT_THEME_PRESETS`), so dark is the right default before the persisted
// choice is known, rather than left to HeroUI's own light default. The inline script below corrects
// this synchronously (before first paint) if the cached theme is `white`, the same way it corrects
// the app's own color-theme token overrides (a separate `[data-theme='dark']`-scoped set, see
// `theme.css`) from a flash of `default`.
const Document = () => {
  return (
    <Html className={FONT_VARIABLE_CLASSNAME} data-theme='dark' lang='en'>
      <Head>
        {/* Runs before hydration so the first frame already shows the persisted theme instead of
            flashing `default` - see `themeInitScript.ts`'s doc comment for why this is only
            provisional (no tier check happens here) and how `useTheme.ts` reconciles it. */}
        <script dangerouslySetInnerHTML={{ __html: buildThemeInitScript() }} />
        {/* Same provisional-application pattern as the theme script above, for the app-wide font
            choice - see `fontInitScript.ts`/`useFont.ts`. */}
        <script dangerouslySetInnerHTML={{ __html: buildFontInitScript() }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

export default Document
