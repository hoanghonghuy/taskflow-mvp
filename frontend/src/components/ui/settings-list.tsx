import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SettingsListProps = React.ComponentProps<'div'> & {
  children: React.ReactNode
}

/** Grouped settings surface — Settings.app style (list + hairline dividers). */
function SettingsList({ className, children, ...props }: SettingsListProps) {
  return (
    <div
      data-slot="settings-list"
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-card divide-y divide-border',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

type SettingsRowProps = {
  label: React.ReactNode
  description?: React.ReactNode
  descriptionId?: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

/** One settings row: label (+ optional description) left, control right. */
function SettingsRow({
  label,
  description,
  descriptionId,
  htmlFor,
  children,
  className,
  disabled = false,
}: SettingsRowProps) {
  return (
    <div
      data-slot="settings-row"
      className={cn(
        'flex items-center justify-between gap-4 px-3.5 py-3',
        disabled && 'opacity-60',
        className,
      )}
    >
      <div className="min-w-0 space-y-0.5">
        {htmlFor ? (
          <label
            htmlFor={htmlFor}
            className={cn(
              'text-sm font-medium leading-snug text-foreground',
              disabled && 'cursor-not-allowed',
            )}
          >
            {label}
          </label>
        ) : (
          <div className="text-sm font-medium leading-snug text-foreground">{label}</div>
        )}
        {description ? (
          <p id={descriptionId} className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  )
}

type SettingsNumberStepperProps = {
  id: string
  label: React.ReactNode
  value: number
  min?: number
  onChange: (raw: string) => void
  onStep: (delta: number) => void
  decreaseAriaLabel: string
  increaseAriaLabel: string
}

function SettingsNumberStepper({
  id,
  label,
  value,
  min = 1,
  onChange,
  onStep,
  decreaseAriaLabel,
  increaseAriaLabel,
}: SettingsNumberStepperProps) {
  return (
    <SettingsRow label={label} htmlFor={id}>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          onClick={() => onStep(-1)}
          aria-label={decreaseAriaLabel}
        >
          –
        </Button>
        <input
          id={id}
          type="number"
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 rounded-md bg-secondary/50 px-2 py-1 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          onClick={() => onStep(1)}
          aria-label={increaseAriaLabel}
        >
          +
        </Button>
      </div>
    </SettingsRow>
  )
}

export { SettingsList, SettingsNumberStepper, SettingsRow }
