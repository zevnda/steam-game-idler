import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
// Language file imports
import translationDEDE from '@/i18n/locales/de-DE/translation.json'
import translationENUS from '@/i18n/locales/en-US/translation.json'
import translationESES from '@/i18n/locales/es-ES/translation.json'
import translationFRFR from '@/i18n/locales/fr-FR/translation.json'
import translationIDID from '@/i18n/locales/id-ID/translation.json'
import translationITIT from '@/i18n/locales/it-IT/translation.json'
import translationMKMK from '@/i18n/locales/mk-MK/translation.json'
import translationPLPL from '@/i18n/locales/pl-PL/translation.json'
import translationPTBR from '@/i18n/locales/pt-BR/translation.json'
import translationRORO from '@/i18n/locales/ro-RO/translation.json'
import translationRURU from '@/i18n/locales/ru-RU/translation.json'
import translationSLSI from '@/i18n/locales/sl-SI/translation.json'
import translationTRTR from '@/i18n/locales/tr-TR/translation.json'
import translationUKUA from '@/i18n/locales/uk-UA/translation.json'
import translationZHCN from '@/i18n/locales/zh-CN/translation.json'

export const ns = ['translation'] as const
export const defaultNS = 'translation' as const

const resources = {
  'de-DE': { translation: translationDEDE },
  'en-US': { translation: translationENUS },
  'es-ES': { translation: translationESES },
  'fr-FR': { translation: translationFRFR },
  'id-ID': { translation: translationIDID },
  'it-IT': { translation: translationITIT },
  'mk-MK': { translation: translationMKMK },
  'pl-PL': { translation: translationPLPL },
  'pt-BR': { translation: translationPTBR },
  'ro-RO': { translation: translationRORO },
  'ru-RU': { translation: translationRURU },
  'sl-SI': { translation: translationSLSI },
  'tr-TR': { translation: translationTRTR },
  'uk-UA': { translation: translationUKUA },
  'zh-CN': { translation: translationZHCN },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: {
      default: ['en-US'],
    },
    debug: process.env.NODE_ENV === 'development',

    ns,
    defaultNS,
    partialBundledLanguages: true,

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },
  })

export default i18n

declare module 'i18next' {
  interface CustomTypeOptions {
    ns: typeof ns
    defaultNS: typeof defaultNS
    resources: (typeof resources)['en-US']
  }
}
