'use client'

import { cn } from '@/lib/utils'

type TaskMoveOption = {
  value: string
  label: string
}

type TaskMoveControlProps = {
  label: string
  value: string
  options: TaskMoveOption[]
  onMove: (value: string) => void
  disabled?: boolean
  className?: string
}

/** Accessible fallback for touch/keyboard when drag-and-drop is unavailable. */
export function TaskMoveControl({
  label,
  value,
  options,
  onMove,
  disabled = false,
  className,
}: TaskMoveControlProps) {
  return (
    <div
      className={cn(
        'mt-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100',
        className,
      )}
    >
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          if (event.target.value !== value) {
            onMove(event.target.value)
          }
        }}
        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:h-8 md:text-xs"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
