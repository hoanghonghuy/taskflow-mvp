"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/lib/hooks/use-toast'
import { useI18n } from '@/lib/i18n/hooks'

export default function ForgotPasswordPage() {
  const { error } = useToast()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setEmailError(null)

    if (!email) {
      setEmailError(t('auth.errors.emailRequired'))
      error(t('auth.toast.forgotFailedTitle'), t('auth.errors.emailRequired'))
      return
    }
    if (!email.includes('@')) {
      setEmailError(t('auth.errors.emailInvalid'))
      error(t('auth.toast.forgotFailedTitle'), t('auth.errors.emailInvalid'))
      return
    }

    setIsLoading(true)
    try {
      error(
        t('auth.toast.forgotUnavailableTitle'),
        t('auth.toast.forgotUnavailableBody')
      )
    } catch {
      error(t('auth.toast.forgotFailedTitle'), t('auth.toast.forgotFailedBody'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t('auth.forgotPasswordTitle')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.forgotPasswordSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t('auth.email')}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {emailError && <p className="text-xs text-destructive mt-1">{emailError}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('auth.sending') : t('auth.sendResetLink')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            {t('auth.rememberPassword')}{' '}
            <Link href="/login" className="text-primary hover:underline">
              {t('auth.signIn')}
            </Link>
          </div>
          <div className="text-sm text-center text-muted-foreground">
            <Link href="/" className="hover:underline">
              {t('auth.backToHome')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
