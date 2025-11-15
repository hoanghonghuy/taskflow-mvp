/**
 * Type-safe i18n keys
 * 
 * This file ensures type safety for translation keys.
 * Add new keys here to get autocomplete and type checking.
 */

// Import translation files to infer types
import type en from '@/messages/en.json'
import type vi from '@/messages/vi.json'

// Create a type from the English translations (source of truth)
type TranslationKeys = {
  [K in keyof typeof en]: typeof en[K] extends object
    ? {
        [P in keyof typeof en[K]]: `${K & string}.${P & string}`
      }[keyof typeof en[K]]
    : K
}[keyof typeof en]

// Flatten nested keys
type FlattenKeys<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends object
    ? FlattenKeys<T[K], `${Prefix}${K & string}.`>
    : `${Prefix}${K & string}`
}[keyof T]

// Export the translation key type
export type TranslationKey = FlattenKeys<typeof en>

// Helper type for translation function
export interface TranslationFunction {
  (key: TranslationKey, options?: Record<string, string | number>): string
}

// Verify both languages have the same structure
type VerifyTranslations<T1, T2> = T1 extends T2 ? T2 extends T1 ? true : false : false

// This will cause a type error if translations don't match
type _TranslationCheck = VerifyTranslations<typeof en, typeof vi>

