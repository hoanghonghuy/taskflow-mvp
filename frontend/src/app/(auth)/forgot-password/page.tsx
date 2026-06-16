"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/hooks'
import { PASSWORD_RESET_ENABLED } from '@/lib/feature-flags'

export default function ForgotPasswordPage() {
  const { t } = useI18n()

  if (PASSWORD_RESET_ENABLED) {
    // Placeholder cho khi ship reset password thật (form + API email).
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <p className="text-center">
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {t('auth.forgotPasswordMvpBadge')}
            </span>
          </p>
          <CardTitle className="text-2xl font-bold text-center">{t('auth.forgotPasswordTitle')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.toast.forgotUnavailableTitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            {t('auth.toast.forgotUnavailableBody')}
          </p>
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
            <p className="text-sm font-medium">{t('auth.forgotPasswordAlternativesTitle')}</p>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>{t('auth.forgotPasswordAlternativeRegister')}</li>
              <li>{t('auth.forgotPasswordAlternativeRetry')}</li>
              <li>{t('auth.forgotPasswordAlternativeAdmin')}</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button asChild className="w-full">
            <Link href="/register">{t('auth.signUp')}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">{t('auth.signIn')}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
