'use client'

import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import type { Settings } from '@/types'

export function useI18n() {
  const { t, i18n } = useTranslation()

  // Get current language
  const currentLanguage = i18n.language as Settings['language']

  // Change language function
  const changeLanguage = useCallback((lang: Settings['language']) => {
    i18n.changeLanguage(lang)
  }, [i18n])

  // Toggle between EN and VI
  const toggleLanguage = useCallback(() => {
    const newLang = currentLanguage === 'en' ? 'vi' : 'en'
    changeLanguage(newLang)
  }, [currentLanguage, changeLanguage])

  return {
    t,
    currentLanguage,
    changeLanguage,
    toggleLanguage,
    isEnglish: currentLanguage === 'en',
    isVietnamese: currentLanguage === 'vi',
  }
}

// Helper function for safe translations
export function useTranslate() {
  const { t } = useTranslation()
  
  return useCallback((key: string, defaultValue?: string) => {
    try {
      return t(key, defaultValue || key)
    } catch (error) {
      console.warn(`Translation missing for key: ${key}`)
      return defaultValue || key
    }
  }, [t])
}
