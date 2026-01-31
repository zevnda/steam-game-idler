import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import { config } from '@/shared/config/env'
import translationENUS from '@/shared/config/i18n/locales/en-US/translation.json'
import translationRU from '@/shared/config/i18n/locales/ru/translation.json'

const resources = {
  'en-US': { translation: translationENUS },
  'ru': { translation: translationRU },
}

export const ns = ['translation'] as const

export const defaultNS = 'translation' as const

export const initI18n = () => {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      debug: config.isDev,
      resources,
      ns,
      defaultNS,
      partialBundledLanguages: true,

      fallbackLng: {
        be: ['ru'],
        uk: ['ru'],
        kk: ['ru'],
        default: ['en-US'],
      },

      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'locale',
        caches: ['localStorage'],
      },

      interpolation: {
        escapeValue: false,
      },
    })
}
