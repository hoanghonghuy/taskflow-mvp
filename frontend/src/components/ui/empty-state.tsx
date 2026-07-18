import * as React from 'react'

import { cn } from '@/lib/utils'

type EmptyStateProps = {
  title: React.ReactNode
  description?: React.ReactNode
  /** Lucide / custom icon shown in a dashed circle (page empty). */
  icon?: React.ReactNode
  /** Full illustration node (e.g. EMPTY_STATE_ILLUSTRATIONS). */
  illustration?: React.ReactNode
  action?: React.ReactNode
  /** Compact for column / nested empty (matrix, calendar day). */
  compact?: boolean
  className?: string
}

/** Shared empty placeholder for list / feature views. */
export function EmptyState({
  title,
  description,
  icon,
  illustration,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center text-muted-foreground',
        compact ? 'min-h-[120px] px-4 py-6' : 'px-4 py-12',
        className,
      )}
    >
      {illustration}
      {!illustration && icon ? (
        <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-dashed border-border bg-card text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h2
        className={cn(
          'font-semibold text-foreground',
          compact ? 'text-sm' : 'mt-4 text-xl',
          illustration && !compact && 'mt-4',
          icon && !illustration && !compact && 'mt-6 text-2xl tracking-tight',
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className={cn('max-w-sm text-sm', compact ? 'mt-1' : 'mt-2')}>{description}</p>
      ) : null}
      {action ? <div className={cn(compact ? 'mt-3' : 'mt-6')}>{action}</div> : null}
    </div>
  )
}
