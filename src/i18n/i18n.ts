import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import translationAFZA from '@/i18n/locales/af-ZA/translation.json'
import translationARSA from '@/i18n/locales/ar-SA/translation.json'
import translationBGBG from '@/i18n/locales/bg-BG/translation.json'
import translationBNBD from '@/i18n/locales/bn-BD/translation.json'
import translationCAES from '@/i18n/locales/ca-ES/translation.json'
import translationCSCZ from '@/i18n/locales/cs-CZ/translation.json'
import translationDADK from '@/i18n/locales/da-DK/translation.json'
import translationDEDE from '@/i18n/locales/de-DE/translation.json'
import translationELGR from '@/i18n/locales/el-GR/translation.json'
import translationENUS from '@/i18n/locales/en-US/translation.json'
import translationESES from '@/i18n/locales/es-ES/translation.json'
import translationETEE from '@/i18n/locales/et-EE/translation.json'
import translationFAIR from '@/i18n/locales/fa-IR/translation.json'
import translationFIFI from '@/i18n/locales/fi-FI/translation.json'
import translationFRFR from '@/i18n/locales/fr-FR/translation.json'
import translationHEIL from '@/i18n/locales/he-IL/translation.json'
import translationHIIN from '@/i18n/locales/hi-IN/translation.json'
import translationHUHU from '@/i18n/locales/hu-HU/translation.json'
import translationIDID from '@/i18n/locales/id-ID/translation.json'
import translationITIT from '@/i18n/locales/it-IT/translation.json'
import translationJAJP from '@/i18n/locales/ja-JP/translation.json'
import translationKOKR from '@/i18n/locales/ko-KR/translation.json'
import translationLTLT from '@/i18n/locales/lt-LT/translation.json'
import translationLVLV from '@/i18n/locales/lv-LV/translation.json'
import translationNLNL from '@/i18n/locales/nl-NL/translation.json'
import translationNONO from '@/i18n/locales/no-NO/translation.json'
import translationPLPL from '@/i18n/locales/pl-PL/translation.json'
import translationPTBR from '@/i18n/locales/pt-BR/translation.json'
import translationPTPT from '@/i18n/locales/pt-PT/translation.json'
import translationRORO from '@/i18n/locales/ro-RO/translation.json'
import translationRURU from '@/i18n/locales/ru-RU/translation.json'
import translationSKSK from '@/i18n/locales/sk-SK/translation.json'
import translationSLSI from '@/i18n/locales/sl-SI/translation.json'
import translationSRSP from '@/i18n/locales/sr-SP/translation.json'
import translationSVSE from '@/i18n/locales/sv-SE/translation.json'
import translationTHTH from '@/i18n/locales/th-TH/translation.json'
import translationTLPH from '@/i18n/locales/tl-PH/translation.json'
import translationTRTR from '@/i18n/locales/tr-TR/translation.json'
import translationUKUA from '@/i18n/locales/uk-UA/translation.json'
import translationVIVN from '@/i18n/locales/vi-VN/translation.json'
import translationZHCN from '@/i18n/locales/zh-CN/translation.json'
import translationZHTW from '@/i18n/locales/zh-TW/translation.json'

const resources = {
  'af-ZA': { translation: translationAFZA },
  'ar-SA': { translation: translationARSA },
  'bg-BG': { translation: translationBGBG },
  'bn-BD': { translation: translationBNBD },
  'ca-ES': { translation: translationCAES },
  'cs-CZ': { translation: translationCSCZ },
  'da-DK': { translation: translationDADK },
  'de-DE': { translation: translationDEDE },
  'el-GR': { translation: translationELGR },
  'en-US': { translation: translationENUS },
  'es-ES': { translation: translationESES },
  'et-EE': { translation: translationETEE },
  'fa-IR': { translation: translationFAIR },
  'fi-FI': { translation: translationFIFI },
  'fr-FR': { translation: translationFRFR },
  'he-IL': { translation: translationHEIL },
  'hi-IN': { translation: translationHIIN },
  'hu-HU': { translation: translationHUHU },
  'id-ID': { translation: translationIDID },
  'it-IT': { translation: translationITIT },
  'ja-JP': { translation: translationJAJP },
  'ko-KR': { translation: translationKOKR },
  'lt-LT': { translation: translationLTLT },
  'lv-LV': { translation: translationLVLV },
  'nl-NL': { translation: translationNLNL },
  'no-NO': { translation: translationNONO },
  'pl-PL': { translation: translationPLPL },
  'pt-BR': { translation: translationPTBR },
  'pt-PT': { translation: translationPTPT },
  'ro-RO': { translation: translationRORO },
  'ru-RU': { translation: translationRURU },
  'sl-SI': { translation: translationSLSI },
  'sk-SK': { translation: translationSKSK },
  'sr-SP': { translation: translationSRSP },
  'sv-SE': { translation: translationSVSE },
  'th-TH': { translation: translationTHTH },
  'tl-PH': { translation: translationTLPH },
  'tr-TR': { translation: translationTRTR },
  'uk-UA': { translation: translationUKUA },
  'vi-VN': { translation: translationVIVN },
  'zh-CN': { translation: translationZHCN },
  'zh-TW': { translation: translationZHTW },
}

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
  })

export default i18n
