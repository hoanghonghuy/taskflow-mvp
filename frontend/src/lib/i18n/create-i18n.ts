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

    try {
      const settings = localStorage.getItem('settings')
      if (settings) {
        const parsed = JSON.parse(settings) as Record<string, unknown>
        parsed.language = lng
        localStorage.setItem('settings', JSON.stringify(parsed))
      }
    } catch {
      // ignore localStorage errors
    }
  })

  return instance
}
