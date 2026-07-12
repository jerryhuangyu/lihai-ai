import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { enTranslation } from './en'
import { zhTWTranslation } from './zh-tw'

export const defaultNS = 'common'
export const resources = {
  en: enTranslation,
  zh: zhTWTranslation,
} as const

// 純 client SPA（Vite + GitHub Pages），無 SSR，window 恆存在，
// 故不需要 argus 的 isBrowser 守衛。
const i18n = i18next.createInstance()

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    defaultNS,
    ns: ['common', 'shell', 'import', 'dashboard', 'sessions'],
    resources,
    interpolation: { escapeValue: false },
  })

export default i18n
