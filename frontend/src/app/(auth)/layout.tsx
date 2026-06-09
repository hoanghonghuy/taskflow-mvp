'use client'

import { LanguageToggle } from '@/components/i18n/LanguageToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LanguageToggle variant="fixed" />
      {children}
    </>
  )
}
