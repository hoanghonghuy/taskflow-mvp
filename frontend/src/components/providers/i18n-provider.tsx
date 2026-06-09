'use client'

import { useMemo } from 'react'
import { I18nextProvider } from 'react-i18next'
import { createAppI18n } from '@/lib/i18n/config'
import type { Settings } from '@/types'

interface I18nProviderProps {
  children: React.ReactNode
  initialLocale: Settings['language']
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const i18n = useMemo(() => createAppI18n(initialLocale), [initialLocale])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
