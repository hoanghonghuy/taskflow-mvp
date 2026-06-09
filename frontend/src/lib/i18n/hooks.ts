/**
 * Enhanced i18n hooks with type safety
 * 
 * This provides type-safe translation functions that ensure
 * translation keys exist and are properly typed.
 */

import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import type { Settings } from '@/types'
import type { TranslationKey, TranslationFunction } from './types'

/**
 * Type-safe i18n hook
 * 
 * Provides translation function with autocomplete and type checking
 * 
 * @example
 * ```tsx
 * const { t } = useI18n()
 * const text = t('nav.dashboard') // ✅ Type-safe
 * const text2 = t('nav.invalid') // ❌ Type error
 * ```
 */
export function useI18n() {
  const { t: i18nT, i18n } = useTranslation()

  // Get current language
  const currentLanguage = i18n.language as Settings['language']

  // Type-safe translation function
  const t: TranslationFunction = useCallback(
    (key: TranslationKey, options?: Record<string, string | number>) => {
      return i18nT(key, options) as string
    },
    [i18nT]
  )

  // Change language function
  const changeLanguage = useCallback(
    (lang: Settings['language']) => {
      i18n.changeLanguage(lang)
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', lang)
      }
    },
    [i18n]
  )

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

/**
 * Safe translation hook with fallback
 * 
 * Returns the translation or a fallback value if translation is missing
 * 
 * @example
 * ```tsx
 * const translate = useSafeTranslate()
 * const text = translate('nav.dashboard', 'Dashboard')
 * ```
 */
export function useSafeTranslate() {
  const { t } = useTranslation()

  return useCallback(
    (key: TranslationKey, fallback?: string) => {
      const translation = t(key)
      // If translation returns the key (meaning it's missing), use fallback
      return translation === key ? (fallback || key) : translation
    },
    [t]
  )
}

