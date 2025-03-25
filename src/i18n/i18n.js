import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import translationDE from '@/i18n/locales/de/translation.json';
import translationEN from '@/i18n/locales/en/translation.json';
import translationIT from '@/i18n/locales/it/translation.json';
import translationPTBR from '@/i18n/locales/pt-BR/translation.json';
import translationRU from '@/i18n/locales/ru/translation.json';
import translationUK from '@/i18n/locales/uk/translation.json';

const resources = {
    'de': { translation: translationDE },
    'en': { translation: translationEN },
    'it': { translation: translationIT },
    'pt-BR': { translation: translationPTBR },
    'ru': { translation: translationRU },
    'uk': { translation: translationUK },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        debug: process.env.NODE_ENV === 'development',

        ns: ['translation'],
        defaultNS: 'translation',
        partialBundledLanguages: true,

        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'],
        },

        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;