import * as React from 'react'

import { cn } from '@/lib/utils'

type SettingsSectionProps = {
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  /** Max width of the card body (default max-w-xl). */
  maxWidthClassName?: string
  className?: string
  contentClassName?: string
}

/** Settings page section: title + bordered card body. */
export function SettingsSection({
  title,
  description,
  children,
  maxWidthClassName = 'max-w-xl',
  className,
  contentClassName,
}: SettingsSectionProps) {
  return (
    <section className={className}>
      <h2 className={cn('text-lg font-semibold', description ? 'mb-2' : 'mb-4')}>{title}</h2>
      {description ? (
        <p className="mb-4 max-w-xl text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div
        className={cn(
          'rounded-lg border border-border bg-card p-4',
          maxWidthClassName,
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  )
}
