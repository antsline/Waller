import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocales } from 'expo-localization'

import ja from './locales/ja.json'
import en from './locales/en.json'

const deviceLocale = getLocales()[0]?.languageCode ?? 'en'

i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: ja },
    en: { translation: en },
  },
  lng: deviceLocale === 'ja' ? 'ja' : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
