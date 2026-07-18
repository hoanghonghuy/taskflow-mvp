'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/** Toggle group — closer to shadcn TabsList / muted pill strip. */
const segmentedControlVariants = cva(
  'inline-flex items-center rounded-md border border-input bg-muted p-0.5',
  {
    variants: {
      size: {
        sm: '',
        md: '',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  },
)

const segmentedItemVariants = cva(
  [
    'inline-flex items-center justify-center rounded-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'min-w-[2.5rem] px-2.5 py-1 text-xs',
        md: 'min-w-[3rem] px-3 py-1.5 text-sm',
      },
      active: {
        true: 'bg-background text-foreground shadow-sm',
        false: 'text-muted-foreground hover:text-foreground',
      },
    },
    defaultVariants: {
      size: 'sm',
      active: false,
    },
  },
)

export interface SegmentedControlOption<T extends string> {
  value: T
  label: React.ReactNode
  disabled?: boolean
}

export interface SegmentedControlProps<T extends string>
  extends VariantProps<typeof segmentedControlVariants> {
  value: T
  options: SegmentedControlOption<T>[]
  onValueChange: (value: T) => void
  className?: string
  'aria-label'?: string
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onValueChange,
  size,
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(segmentedControlVariants({ size }), className)}
    >
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            onClick={() => onValueChange(opt.value)}
            aria-pressed={active}
            className={cn(segmentedItemVariants({ size, active }))}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
