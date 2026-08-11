'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n/hooks'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const { t } = useI18n()

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-xl font-semibold">{t('common.notFoundTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('common.notFoundBody')}</p>
        <Button asChild>
          <Link href="/dashboard">{t('common.goToDashboard')}</Link>
        </Button>
      </div>
    </div>
  )
}
