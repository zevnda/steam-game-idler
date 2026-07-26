import { FONT_STORAGE_KEY } from './applyFont'
import { FONT_CSS_VARS, FONT_SIZE_SCALE } from './font'

// Builds a pre-hydration inline `<script>` body for `_document.tsx` - reads the last-applied font
// key from `localStorage` synchronously (before React ever mounts) and writes `--font-sans`'s
// (and, where applicable, `--font-size-scale`'s) inline override, so the first frame already shows
// the right font at the right size instead of flashing `inter` and then correcting once
// `useFont.ts` finishes its own `get_settings` round trip. Mirrors `themeInitScript.ts` exactly,
// including being provisional (no tier check happens this early - `useFont.ts` reconciles against
// the real settings + subscription tier once mounted).
export function buildFontInitScript() {
  const varsJson = JSON.stringify(FONT_CSS_VARS)
  const scaleJson = JSON.stringify(FONT_SIZE_SCALE)
  return `(function(){try{var key=localStorage.getItem(${JSON.stringify(FONT_STORAGE_KEY)});if(!key||key==='inter')return;var vars=${varsJson};var cssVar=vars[key];if(!cssVar)return;var html=document.documentElement;html.style.setProperty('--font-sans','var('+cssVar+'), ui-sans-serif, system-ui, sans-serif');var scales=${scaleJson};var scale=scales[key];if(scale!==undefined)html.style.setProperty('--font-size-scale',String(scale));}catch(e){}})();`
}
