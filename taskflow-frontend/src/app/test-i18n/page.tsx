'use client'

import { useI18n } from '@/lib/hooks/use-i18n'
import { I18nProvider } from '@/components/providers/i18n-provider'
import { Button } from '@/components/ui/button'

function TestContent() {
  const { t, currentLanguage, toggleLanguage } = useI18n()
  
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">{t('app.name')}</h1>
      <p>{t('app.description')}</p>
      
      <div className="flex gap-2">
        <Button onClick={toggleLanguage}>
          Current: {currentLanguage} - Click to toggle
        </Button>
      </div>
      
      <div className="space-y-2">
        <p>{t('nav.dashboard')}</p>
        <p>{t('task.new')}</p>
        <p>{t('priority.high')}</p>
      </div>
    </div>
  )
}

export default function TestI18nPage() {
  return (
    <I18nProvider>
      <TestContent />
    </I18nProvider>
  )
}
