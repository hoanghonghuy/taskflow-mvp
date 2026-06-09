import type { Settings } from '@/types'

export const LOCALE_COOKIE = 'taskflow_locale'

export function parseLocale(value: string | undefined | null): Settings['language'] {
  return value === 'vi' ? 'vi' : 'en'
}

export function setLocaleCookie(locale: Settings['language']): void {
  if (typeof document === 'undefined') return
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
}
