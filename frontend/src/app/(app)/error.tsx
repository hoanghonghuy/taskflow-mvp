'use client'

import { useEffect } from 'react'
import { useI18n } from '@/lib/i18n/hooks'
import { Button } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useI18n()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-xl font-semibold">{t('common.errorTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('common.errorBody')}</p>
        <Button onClick={reset}>{t('common.tryAgain')}</Button>
      </div>
    </div>
  )
}
