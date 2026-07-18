import { cn } from '@/lib/utils'

/** Soft placeholder — muted tone, no loud accent flash. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'animate-pulse rounded-md bg-muted/70 dark:bg-muted/50',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
