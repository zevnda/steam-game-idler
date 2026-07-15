import type { ParseKeys } from 'i18next'
import { initReactI18next } from 'react-i18next'
import enUS from './locales/en-US.json'
import frFR from './locales/fr-FR.json'
import itIT from './locales/it-IT.json'
import ptBR from './locales/pt-BR.json'
import ruRU from './locales/ru-RU.json'
import slSI from './locales/sl-SI.json'
import trTR from './locales/tr-TR.json'
import zhCN from './locales/zh-CN.json'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

export const ns = ['translation'] as const
export const defaultNS = 'translation' as const

// Only en-US is hand-maintained - every other locale below starts as an empty `{}` placeholder
// synced in later by Crowdin (`.github/crowdin.yml`).
// i18next's fallbackLng resolves any key missing from an empty/partial locale back to en-US
// automatically, so shipping empty files today is safe and needs no code change once Crowdin
// starts filling them in.
const resources = {
  'en-US': { translation: enUS },
  'fr-FR': { translation: frFR },
  'it-IT': { translation: itIT },
  'pt-BR': { translation: ptBR },
  'ru-RU': { translation: ruRU },
  'sl-SI': { translation: slSI },
  'tr-TR': { translation: trTR },
  'zh-CN': { translation: zhCN },
}

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en-US',
      supportedLngs: Object.keys(resources),
      // Every supported locale is region-qualified (en-US, de-DE, ...) with no bare-language
      // ('en', 'de') resources - without this, i18next's default resolve hierarchy still tries
      // the bare-language part of the current locale on every t() call, logging a
      // "rejecting language code not found in supportedLngs" warning each time since it never
      // matches supportedLngs. `currentOnly` skips that language-only/script fallback tier.
      load: 'currentOnly',
      ns,
      defaultNS,
      debug: process.env.NODE_ENV === 'development',
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'i18nextLng',
        caches: ['localStorage'],
      },
      interpolation: {
        escapeValue: false,
      },
      returnNull: false,
    })
} else if (process.env.NODE_ENV === 'development') {
  // Next.js Fast Refresh re-executes this whole module (including the `resources` snapshot
  // above) when a locale JSON changes, but `i18n` here is still the same cached singleton from
  // the `i18next` package - Fast Refresh doesn't re-run unrelated package modules, only this
  // file and its dependents - so `isInitialized` is already true and the branch above never
  // reruns `.init()`. Push the freshly re-imported translations into that live instance
  // directly instead, so editing en-US.json shows up without a manual page refresh.
  Object.entries(resources).forEach(([lng, { translation }]) => {
    i18n.addResourceBundle(lng, defaultNS, translation, true, true)
  })
  i18n.emit('languageChanged', i18n.language)
}

export default i18n

// Gives every literal-key `t()` call compile-time coverage against en-US's actual key shape - a
// typo'd or removed key becomes a TS error at the call site instead of silently falling back to
// the raw key string at runtime. See i18next's own docs: node_modules/i18next/typescript/options.d.ts.
//
// IMPORTANT for a *dynamically computed* key (an error-code -> message-key mapper, a data-driven
// nav/tab label list): once resources are typed like this, i18next's `t()` overloads only accept a
// literal key (or a literal union) for a call that also passes an options object - a widened
// `string` no longer matches any overload at all (not "loses type-checking", a hard compile
// error). Type that dynamic value as `TranslationKey` below (not `string`) at its source - e.g.
// `Record<string, TranslationKey>` for a code->key map, or `labelKey: TranslationKey` on a
// data-driven array's item type - so the union of literals it can produce still satisfies `t()`,
// AND each individual mapped key gets checked against en-US too. Every `errorMessageKey`-style
// util under `src/features/*/utils/` already does this - follow that pattern for a new one.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    returnNull: false
    resources: (typeof resources)['en-US']
  }
}

// See the IMPORTANT note above - every valid dot-path key in en-US.json's `translation` namespace.
export type TranslationKey = ParseKeys
