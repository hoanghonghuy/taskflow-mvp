"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const segmentedControlVariants = cva(
  "inline-flex rounded-full border border-border bg-muted/40 p-0.5",
  {
    variants: {
      size: {
        sm: "",
        md: "",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
)

const segmentedItemVariants = cva(
  "rounded-full border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "px-2.5 py-1 text-xs",
        md: "px-3 py-1 text-sm",
      },
      active: {
        true: "border-2 border-primary bg-background font-semibold text-primary shadow-sm",
        false: "border-transparent text-muted-foreground hover:bg-background/60",
      },
    },
    defaultVariants: {
      size: "sm",
      active: false,
    },
  }
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
  "aria-label"?: string
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onValueChange,
  size,
  className,
  "aria-label": ariaLabel,
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
