import { createI18n } from 'vue-i18n'
import en from './locales/en-us.json'
import zh from './locales/zh-tw.json'

const messages = {
  'en-us': en,
  'zh-tw': zh,
}

const params = new URLSearchParams(window.location.search)
const defaultLocale = 'zh-tw'
const locale = params.get('lang') || defaultLocale

export const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en-us',
  messages,
})
