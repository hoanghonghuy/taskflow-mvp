import * as React from 'react'

import { cn } from '@/lib/utils'

type StatCardProps = {
  label: React.ReactNode
  value: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  /** Optional accent dot (habits-style). */
  accentColor?: string
  /** Apply accent color to the value text. */
  valueAccent?: boolean
  variant?: 'default' | 'compact' | 'muted'
  className?: string
  title?: string
  onClick?: () => void
}

/** Metric card — profile / habits / pomodoro / task list summary. */
export function StatCard({
  label,
  value,
  description,
  icon,
  accentColor,
  valueAccent = false,
  variant = 'default',
  className,
  title,
  onClick,
}: StatCardProps) {
  const Comp = onClick ? 'button' : 'div'

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      title={title}
      onClick={onClick}
      className={cn(
        'text-left transition-colors',
        variant === 'default' && 'rounded-lg border border-border bg-card p-6 shadow-sm',
        variant === 'compact' && 'rounded-lg border border-border bg-card p-4 shadow-sm',
        variant === 'muted' && 'rounded-lg bg-secondary/50 p-4',
        onClick && 'cursor-pointer hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',        className,
      )}
    >
      <div className="flex items-center gap-2">
        {accentColor ? (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: accentColor }}
            aria-hidden
          />
        ) : null}
        {icon ? <span className="shrink-0 text-muted-foreground">{icon}</span> : null}
        <p
          className={cn(
            'text-muted-foreground',
            variant === 'muted' ? 'text-xs font-medium uppercase' : 'text-sm',
            icon && 'font-semibold text-foreground',
          )}
        >
          {label}
        </p>
      </div>
      <p
        className={cn(
          'font-semibold tabular-nums',
          variant === 'muted' ? 'mt-2 text-2xl' : 'mt-1 text-2xl',
          icon && 'text-3xl font-bold',
        )}
        style={valueAccent && accentColor ? { color: accentColor } : undefined}
      >
        {value}
      </p>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </Comp>
  )
}
