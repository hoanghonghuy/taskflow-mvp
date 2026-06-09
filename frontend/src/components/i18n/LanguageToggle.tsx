'use client'

import { useSettings } from '@/components/providers/settings-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { GlobeAltIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { Settings } from '@/types'

type LanguageToggleProps = {
  variant?: 'fixed' | 'inline'
  showIcon?: boolean
  className?: string
}

const LANGUAGES: Settings['language'][] = ['en', 'vi']

/** Cùng pattern segmented với Calendar / Countdown: viền primary + font-semibold khi chọn. */
export function LanguageToggle({
  variant = 'inline',
  showIcon = true,
  className,
}: LanguageToggleProps) {
  const { language, setLanguage } = useSettings()
  const { t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('settings.languageLabel')}
      className={cn(
        'inline-flex items-center gap-2',
        variant === 'fixed' && 'fixed top-4 right-4 z-50',
        className,
      )}
    >
      {showIcon && (
        <GlobeAltIcon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
      )}
      <div className="inline-flex rounded-full border border-border bg-muted/40 p-0.5">
        {LANGUAGES.map((lang) => {
          const active = language === lang
          return (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              aria-pressed={active}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs transition-colors',
                active
                  ? 'border-2 border-primary bg-background font-semibold text-primary shadow-sm'
                  : 'border-transparent font-medium text-muted-foreground hover:bg-background/60',
              )}
            >
              {t(`settings.language.${lang}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
