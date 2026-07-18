'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/components/providers/user-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/lib/hooks/use-toast'
import { useI18n } from '@/lib/i18n/hooks'
import { EyeIcon, EyeSlashIcon } from '@/lib/icons'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useUser()
  const { success, error } = useToast()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Clear known dev/test credentials if they are ever auto-filled by the browser
  useEffect(() => {
    const isDevTestEmail = email === 'test@example.com' || email === 'dev@example.com'
    const isDevTestPassword =
      password === 'Password123!' || password === 'DevPassword123!'

    if (isDevTestEmail) {
      setEmail('')
    }

    if (isDevTestPassword) {
      setPassword('')
    }
  }, [email, password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setEmailError(null)
    setPasswordError(null)

    if (!email) {
      setEmailError(t('auth.errors.emailRequired'))
    }
    if (!password) {
      setPasswordError(t('auth.errors.passwordRequired'))
    }

    if (!email || !password) {
      error(t('auth.toast.loginFailedTitle'), t('auth.errors.required'))
      return
    }

    setIsLoading(true)
    try {
      const user = await login(email, password)
      success(t('auth.toast.loginSuccessTitle'), t('auth.toast.loginSuccessBody'))
      router.push(user.role === 'ADMIN' ? '/admin' : '/dashboard')
    } catch {
      error(t('auth.toast.loginFailedTitle'), t('auth.toast.loginFailedBody'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t('auth.loginTitle')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.loginSubtitle')}
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
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordError && <p className="text-xs text-destructive mt-1">{passwordError}</p>}
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('auth.loggingIn') : t('auth.login')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="text-primary hover:underline">
              {t('auth.signUp')}
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
