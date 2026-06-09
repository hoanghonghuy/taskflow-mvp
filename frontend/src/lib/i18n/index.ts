/**
 * i18n Public API
 * 
 * This is the main entry point for i18n functionality.
 * All i18n-related exports should go through here.
 */

// Configuration
export { default as i18n } from './config'

// Hooks
export { useI18n, useSafeTranslate } from './hooks'

// Types
export type { TranslationKey, TranslationFunction } from './types'

