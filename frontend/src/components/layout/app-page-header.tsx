import * as React from 'react'

import { AppPageContainer } from '@/components/layout/app-page'
import { cn } from '@/lib/utils'

type AppPageHeaderProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  hint?: React.ReactNode
  actions?: React.ReactNode
  /** Hide on mobile (default true — matches most desktop-only headers). */
  hideOnMobile?: boolean
  /** Keep actions visible on mobile even when title is hidden. */
  actionsAlwaysVisible?: boolean
  titleSize?: 'md' | 'lg'
  className?: string
  /** Extra classes for AppPageContainer; pass null to skip the container wrapper. */
  containerClassName?: string | null
}

/** Shared page title strip used across feature views. */
export function AppPageHeader({
  title,
  subtitle,
  hint,
  actions,
  hideOnMobile = true,
  actionsAlwaysVisible = false,
  titleSize = 'lg',
  className,
  containerClassName,
}: AppPageHeaderProps) {
  const header = (
    <header
      className={cn(
        'shrink-0 border-b border-border py-4 md:py-6',
        hideOnMobile && actionsAlwaysVisible && 'py-2 md:py-6',
        hideOnMobile && !actionsAlwaysVisible && 'hidden md:block',
        className,
      )}
    >
      <div className={cn('flex items-start justify-between gap-4', !actions && 'block')}>
        <div
          className={cn(
            'min-w-0 space-y-1',
            hideOnMobile && actionsAlwaysVisible && 'hidden md:block',
          )}
        >
          <h1
            className={cn(
              'font-bold',
              titleSize === 'lg' ? 'text-2xl md:text-3xl' : 'text-2xl',
            )}
          >
            {title}
          </h1>
          {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {actions ? (
          <div className={cn('shrink-0', actionsAlwaysVisible && 'w-full sm:w-auto')}>
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  )

  if (containerClassName === null) {
    return header
  }

  return <AppPageContainer className={containerClassName}>{header}</AppPageContainer>
}
