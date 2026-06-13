"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/hooks'

export default function ForgotPasswordPage() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t('auth.forgotPasswordTitle')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.toast.forgotUnavailableTitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            {t('auth.toast.forgotUnavailableBody')}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button asChild className="w-full">
            <Link href="/login">{t('auth.signIn')}</Link>
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="text-primary hover:underline">
              {t('auth.signUp')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
