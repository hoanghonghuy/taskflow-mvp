'use client'

import { Globe } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

/** Dropdown chọn ngôn ngữ (Select) — rõ ràng hơn segmented pill. */
export function LanguageToggle({
  variant = 'inline',
  showIcon = true,
  size = 'sm',
  className,
}: LanguageToggleProps) {
  const { language, setLanguage } = useSettings()
  const { t } = useI18n()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        variant === 'fixed' &&
          'fixed top-4 right-4 z-50 rounded-lg border border-border bg-background/95 px-2 py-1.5 shadow-sm backdrop-blur-sm',
        className,
      )}
    >
      {showIcon && (
        <Globe className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      )}
      <Select
        value={language}
        onValueChange={(value) => setLanguage(value as Settings['language'])}
      >
        <SelectTrigger
          size={size === 'sm' ? 'sm' : 'default'}
          className="min-w-[7.5rem]"
          aria-label={t('settings.languageLabel')}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang} value={lang}>
              {t(`settings.language.${lang}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
