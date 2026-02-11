import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
// Language file imports
import translationCSCZ from '@/i18n/locales/cs-CZ/translation.json'
import translationDEDE from '@/i18n/locales/de-DE/translation.json'
import translationENUS from '@/i18n/locales/en-US/translation.json'
import translationESES from '@/i18n/locales/es-ES/translation.json'
import translationFIFI from '@/i18n/locales/fi-FI/translation.json'
import translationFRFR from '@/i18n/locales/fr-FR/translation.json'
import translationHIIN from '@/i18n/locales/hi-IN/translation.json'
import translationIDID from '@/i18n/locales/id-ID/translation.json'
import translationITIT from '@/i18n/locales/it-IT/translation.json'
import translationJAJP from '@/i18n/locales/ja-JP/translation.json'
import translationKOKR from '@/i18n/locales/ko-KR/translation.json'
import translationMKMK from '@/i18n/locales/mk-MK/translation.json'
import translationPLPL from '@/i18n/locales/pl-PL/translation.json'
import translationPTBR from '@/i18n/locales/pt-BR/translation.json'
import translationPTPT from '@/i18n/locales/pt-PT/translation.json'
import translationRORO from '@/i18n/locales/ro-RO/translation.json'
import translationRURU from '@/i18n/locales/ru-RU/translation.json'
import translationTRTR from '@/i18n/locales/tr-TR/translation.json'
import translationUKUA from '@/i18n/locales/uk-UA/translation.json'
import translationZHCN from '@/i18n/locales/zh-CN/translation.json'
import translationZHTW from '@/i18n/locales/zh-TW/translation.json'

export const ns = ['translation'] as const
export const defaultNS = 'translation' as const

const resources = {
  'cs-CZ': { translation: translationCSCZ },
  'de-DE': { translation: translationDEDE },
  'en-US': { translation: translationENUS },
  'es-ES': { translation: translationESES },
  'fi-FI': { translation: translationFIFI },
  'fr-FR': { translation: translationFRFR },
  'hi-IN': { translation: translationHIIN },
  'id-ID': { translation: translationIDID },
  'it-IT': { translation: translationITIT },
  'ja-JP': { translation: translationJAJP },
  'ko-KR': { translation: translationKOKR },
  'mk-MK': { translation: translationMKMK },
  'pl-PL': { translation: translationPLPL },
  'pt-BR': { translation: translationPTBR },
  'pt-PT': { translation: translationPTPT },
  'ro-RO': { translation: translationRORO },
  'ru-RU': { translation: translationRURU },
  'tr-TR': { translation: translationTRTR },
  'uk-UA': { translation: translationUKUA },
  'zh-CN': { translation: translationZHCN },
  'zh-TW': { translation: translationZHTW },
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
