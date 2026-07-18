'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2Icon } from 'lucide-react'

import { SettingsRow } from '@/components/ui/settings-list'
import { cn } from '@/lib/utils'

/** Switch with high-contrast on/off — unchecked = muted track, checked = primary. */
const switchVariants = cva(
  [
    'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border',
    'transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
    'data-[state=unchecked]:border-border data-[state=unchecked]:bg-muted-foreground/35',
    'dark:data-[state=unchecked]:bg-muted-foreground/45',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
        lg: 'h-7 w-12',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

const switchThumbVariants = cva(
  [
    'pointer-events-none block rounded-full bg-white shadow-md ring-0 transition-transform',
    'data-[state=unchecked]:translate-x-0.5',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5 data-[state=checked]:translate-x-[1.125rem]',
        md: 'h-5 w-5 data-[state=checked]:translate-x-5',
        lg: 'h-6 w-6 data-[state=checked]:translate-x-5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
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
      data-size={size ?? 'md'}
      aria-busy={loading || undefined}
      disabled={isDisabled}
      className={cn(switchVariants({ size }), loading && 'opacity-80', className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          switchThumbVariants({ size }),
          loading && 'flex items-center justify-center',
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
  size?: VariantProps<typeof switchVariants>['size']
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
  size = 'md',
  className,
  disabledReason,
}: SwitchFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined
  const switchTitle = disabled && disabledReason ? disabledReason : undefined

  return (
    <SettingsRow
      label={label}
      description={description}
      descriptionId={descriptionId}
      htmlFor={id}
      disabled={disabled || loading}
      className={className}
    >
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
    </SettingsRow>
  )
}

export { Switch, SwitchField, switchVariants }
