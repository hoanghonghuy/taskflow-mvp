'use client'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import translation files
import en from '@/messages/en.json'
import vi from '@/messages/vi.json'

// Khởi tạo i18next
i18n
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: en
      },
      vi: {
        translation: vi
      }
    },
    lng: typeof window !== 'undefined' 
      ? (() => {
          // Try to get from settings first, then localStorage, then default
          try {
            const settings = localStorage.getItem('settings')
            if (settings) {
              const parsed = JSON.parse(settings)
              if (parsed.language) return parsed.language
            }
          } catch (e) {
            // Ignore parse errors
          }
          return localStorage.getItem('language') || 'en'
        })()
      : 'en', // Default language
    fallbackLng: 'en', // Fallback nếu translation thiếu
    
    interpolation: {
      escapeValue: false // React đã escape by default
    },
    
    // Namespace configuration
    defaultNS: 'translation',
    
    react: {
      useSuspense: false // Tắt Suspense để tránh hydration issues
    }
  })

// Listen for language changes và save to localStorage + settings
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lng)
    document.documentElement.lang = lng
    
    // Sync with settings
    try {
      const settings = localStorage.getItem('settings')
      if (settings) {
        const parsed = JSON.parse(settings)
        parsed.language = lng
        localStorage.setItem('settings', JSON.stringify(parsed))
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
})

export default i18n
