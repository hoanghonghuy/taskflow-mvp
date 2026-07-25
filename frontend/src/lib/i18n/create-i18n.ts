import { createInstance, type i18n as I18nInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/messages/en.json'
import vi from '@/messages/vi.json'
import type { Settings } from '@/types'
import { setLocaleCookie } from './locale-cookie'

export function createI18nInstance(locale: Settings['language']): I18nInstance {
  const instance = createInstance()

  instance.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    lng: locale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    defaultNS: 'translation',
    react: { useSuspense: false },
  })

  instance.on('languageChanged', (lng) => {
    if (typeof window === 'undefined') return

    setLocaleCookie(lng as Settings['language'])
    document.documentElement.lang = lng
    // Settings persistence is owned by SettingsProvider (scoped keys).
    // Do not rewrite every settings:* cache — that leaks language across accounts.
  })

  return instance
}
