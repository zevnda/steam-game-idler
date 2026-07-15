import { THEME_STORAGE_KEY } from './applyTheme'
import { LIGHT_THEME_PRESETS, THEME_PRESETS } from './presets'
import { THEME_TOKEN_CSS_VARS } from './tokens'

// Builds a pre-hydration inline `<script>` body for `_document.tsx` - reads the last-applied theme
// key from `localStorage` synchronously (before React ever mounts) and writes its tokens as inline
// custom properties on `<html>`, so the first frame already shows the right theme instead of
// flashing `default` and then correcting once `useTheme.ts` finishes its own `get_settings` round
// trip. Presets/var-name mapping are inlined as JSON at build time (static export renders
// `_document.tsx` once, ahead of time) rather than fetched at runtime - there's nothing dynamic
// about the preset list itself.
//
// Deliberately provisional: this alone doesn't check subscription tier (nothing's loaded yet at
// this point in the page lifecycle) - `useTheme.ts` reconciles against the real settings + tier
// once mounted, and corrects `localStorage` if the cached key turns out to be wrong (e.g. a
// Casual-gated theme the account no longer has access to).
export function buildThemeInitScript() {
  const presetsJson = JSON.stringify(THEME_PRESETS)
  const varsJson = JSON.stringify(THEME_TOKEN_CSS_VARS)
  const lightPresetsJson = JSON.stringify(Array.from(LIGHT_THEME_PRESETS))
  return `(function(){try{var key=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(!key||key==='default')return;var presets=${presetsJson};var vars=${varsJson};var tokens=presets[key];if(!tokens)return;var root=document.documentElement;for(var k in vars){root.style.setProperty(vars[k],tokens[k]);}if(${lightPresetsJson}.indexOf(key)!==-1){root.setAttribute('data-theme','light');}}catch(e){}})();`
}
