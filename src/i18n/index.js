import { createI18n } from 'vue-i18n'
import zh from './locales/zh'
import en from './locales/en'

const savedLocale = localStorage.getItem('translator_locale') || 'zh'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { zh, en },
})

export function setLocale(locale) {
  i18n.global.locale.value = locale
  localStorage.setItem('translator_locale', locale)
}

export const LOCALES = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
]

export default i18n
