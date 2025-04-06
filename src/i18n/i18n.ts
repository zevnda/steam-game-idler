import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import translationCSCZ from '@/i18n/locales/cs-CZ/translation.json';
import translationDEDE from '@/i18n/locales/de-DE/translation.json';
import translationENUS from '@/i18n/locales/en-US/translation.json';
import translationFRFR from '@/i18n/locales/fr-FR/translation.json';
import translationITIT from '@/i18n/locales/it-IT/translation.json';
import translationPLPL from '@/i18n/locales/pl-PL/translation.json';
import translationPTBR from '@/i18n/locales/pt-BR/translation.json';
import translationRORO from '@/i18n/locales/ro-RO/translation.json';
import translationRURU from '@/i18n/locales/ru-RU/translation.json';
import translationTRTR from '@/i18n/locales/tr-TR/translation.json';
import translationUKUA from '@/i18n/locales/uk-UA/translation.json';

const resources = {
    'cs-CZ': { translation: translationCSCZ },
    'de-DE': { translation: translationDEDE },
    'en-US': { translation: translationENUS },
    'fr-FR': { translation: translationFRFR },
    'it-IT': { translation: translationITIT },
    'pl-PL': { translation: translationPLPL },
    'pt-BR': { translation: translationPTBR },
    'ro-RO': { translation: translationRORO },
    'ru-RU': { translation: translationRURU },
    'tr-TR': { translation: translationTRTR },
    'uk-UA': { translation: translationUKUA },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en-US',
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