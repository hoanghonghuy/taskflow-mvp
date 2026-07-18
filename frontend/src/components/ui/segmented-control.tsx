'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const segmentedControlVariants = cva('inline-flex items-center border bg-muted p-0.5', {
  variants: {
    size: {
      sm: '',
      md: '',
    },
    shape: {
      default: 'rounded-md border-input',
      pill: 'rounded-full border-border/60 bg-muted/60',
    },
    fullWidth: {
      true: 'w-full',
      false: '',
    },
  },
  defaultVariants: {
    size: 'sm',
    shape: 'default',
    fullWidth: false,
  },
})

const segmentedItemVariants = cva(
  [
    'inline-flex items-center justify-center font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'min-w-[2.5rem] px-2.5 py-1 text-xs',
        md: 'min-w-[3rem] px-3 py-1.5 text-sm',
      },
      shape: {
        default: 'rounded-sm',
        pill: 'rounded-full',
      },
      active: {
        true: 'bg-background text-foreground shadow-sm',
        false: 'text-muted-foreground hover:text-foreground',
      },
      fullWidth: {
        true: 'flex-1',
        false: '',
      },
    },
    defaultVariants: {
      size: 'sm',
      shape: 'default',
      active: false,
      fullWidth: false,
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
  shape,
  fullWidth,
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(segmentedControlVariants({ size, shape, fullWidth }), className)}
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
            className={cn(segmentedItemVariants({ size, shape, active, fullWidth }))}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
