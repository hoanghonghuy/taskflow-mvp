"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

const switchVariants = cva(
  "peer inline-flex shrink-0 items-center rounded-full border shadow-xs outline-none transition-all focus-visible:ring-[3px] focus-visible:border-ring focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:shadow-[0_0_0_1px_hsl(var(--color-primary)/0.6)] data-[state=unchecked]:bg-muted/60 dark:data-[state=unchecked]:bg-muted/60 data-[state=unchecked]:border-border-subtle",
  {
    variants: {
      size: {
        sm: "h-4 w-7",
        md: "h-[1.15rem] w-8",
        lg: "h-6 w-11",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const switchThumbVariants = cva(
  "pointer-events-none block rounded-full ring-0 transition-transform bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground data-[state=unchecked]:translate-x-0",
  {
    variants: {
      size: {
        sm: "size-3 data-[state=checked]:translate-x-[calc(100%-1px)]",
        md: "size-4 data-[state=checked]:translate-x-[calc(100%-2px)]",
        lg: "size-5 data-[state=checked]:translate-x-[calc(100%-2px)]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root> &
  VariantProps<typeof switchVariants> & {
    loading?: boolean
  }

function Switch({
  className,
  size,
  loading = false,
  disabled,
  ...props
}: SwitchProps) {
  const isDisabled = disabled || loading

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size ?? "md"}
      aria-busy={loading || undefined}
      disabled={isDisabled}
      className={cn(switchVariants({ size }), loading && "opacity-80", className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          switchThumbVariants({ size }),
          loading && "flex items-center justify-center"
        )}
      >
        {loading ? (
          <Loader2Icon className="size-2.5 animate-spin text-muted-foreground" aria-hidden />
        ) : null}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

interface SwitchFieldProps {
  id: string
  label: React.ReactNode
  description?: React.ReactNode
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  loading?: boolean
  size?: VariantProps<typeof switchVariants>["size"]
  className?: string
  disabledReason?: string
}

function SwitchField({
  id,
  label,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled = false,
  loading = false,
  size = "md",
  className,
  disabledReason,
}: SwitchFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined
  const switchTitle = disabled && disabledReason ? disabledReason : undefined

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="space-y-0.5 min-w-0">
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium leading-none",
            (disabled || loading) && "cursor-not-allowed opacity-70"
          )}
        >
          {label}
        </label>
        {description ? (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <Switch
        id={id}
        size={size}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        loading={loading}
        title={switchTitle}
        aria-describedby={descriptionId}
      />
    </div>
  )
}

export { Switch, SwitchField, switchVariants }
