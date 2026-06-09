/**
 * @deprecated Use '@/lib/i18n/hooks' instead for type-safe translations
 * This file is kept for backward compatibility
 */

'use client'

// Re-export from the new location
export { useI18n, useSafeTranslate as useTranslate } from '@/lib/i18n/hooks'
