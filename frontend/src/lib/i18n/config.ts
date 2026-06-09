'use client'

import type { Settings } from '@/types'
import { createI18nInstance } from './create-i18n'

/** Default singleton — prefer I18nProvider instance in React tree. */
const i18n = createI18nInstance('en')

export default i18n

export function createAppI18n(locale: Settings['language']) {
  return createI18nInstance(locale)
}
