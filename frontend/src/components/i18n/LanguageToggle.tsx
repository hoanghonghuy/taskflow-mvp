'use client'

import { useMemo } from 'react'
import { Globe } from 'lucide-react'

import { SegmentedControl } from '@/components/ui/segmented-control'
import { useSettings } from '@/components/providers/settings-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { cn } from '@/lib/utils'
import type { Settings } from '@/types'

type LanguageToggleProps = {
  variant?: 'fixed' | 'inline'
  showIcon?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const LANGUAGES: Settings['language'][] = ['en', 'vi']

/** Segmented EN/VI — không dùng Switch vì cần hiện cả hai lựa chọn rõ ràng. */
export function LanguageToggle({
  variant = 'inline',
  showIcon = true,
  size = 'sm',
  className,
}: LanguageToggleProps) {
  const { language, setLanguage } = useSettings()
  const { t } = useI18n()

  const options = useMemo(
    () =>
      LANGUAGES.map((lang) => ({
        value: lang,
        label: t(`settings.language.${lang}`),
      })),
    [t],
  )

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        variant === 'fixed' &&
          'fixed top-4 right-4 z-50 rounded-full border border-border/60 bg-background/80 px-2 py-1.5 shadow-sm backdrop-blur-sm',
        className,
      )}
    >
      {showIcon && (
        <Globe className="size-[18px] shrink-0 text-foreground" strokeWidth={1.75} aria-hidden />
      )}
      <SegmentedControl
        value={language}
        options={options}
        onValueChange={setLanguage}
        size={size}
        aria-label={t('settings.languageLabel')}
      />
    </div>
  )
}
