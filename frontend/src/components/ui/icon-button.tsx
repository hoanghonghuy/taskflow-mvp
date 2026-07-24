import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        ghost: 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
        destructive: 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
        toolbar: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
      },
      size: {
        sm: 'size-11 p-0.5 md:size-7',
        md: 'size-11 p-1.5 md:size-8',
        lg: 'size-11 p-2 md:size-9',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  },
)

/** Reveal on desktop group-hover (task list / sidebar actions). */
export const revealOnGroupHoverClassName =
  'opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:focus-visible:opacity-100'

type IconButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof iconButtonVariants> & {
    /** Soften into list action chrome (sidebar). */
    revealOnHover?: boolean
  }

function IconButton({
  className,
  variant,
  size,
  revealOnHover = false,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        iconButtonVariants({ variant, size }),
        revealOnHover && revealOnGroupHoverClassName,
        className,
      )}
      {...props}
    />
  )
}

export { IconButton, iconButtonVariants }
