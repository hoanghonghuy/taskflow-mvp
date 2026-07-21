import * as React from 'react'

import { cn } from '@/lib/utils'

type CountBadgeProps = {
  count: number
  className?: string
}

export function CountBadge({ count, className }: CountBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground',
        className,
      )}
    >
      {count}
    </span>
  )
}

type TaskColumnShellProps = {
  children: React.ReactNode
  isDragOver?: boolean
  className?: string
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  /** Board columns are fixed width on desktop; Matrix fills grid cell. */
  variant?: 'board' | 'matrix'
}

/**
 * Shared card shell for Board columns and Matrix quadrants:
 * equal-height card, header + scroll body slots via children composition.
 */
export function TaskColumnShell({
  children,
  isDragOver = false,
  className,
  onDragOver,
  onDragLeave,
  onDrop,
  variant = 'board',
}: TaskColumnShellProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-border bg-card shadow-sm transition-colors',
        variant === 'board' &&
          'w-full min-h-[260px] md:w-72 md:shrink-0 md:min-h-[calc(100dvh-220px)]',
        variant === 'matrix' &&
          'min-h-[160px] md:min-h-[260px]',
        isDragOver && 'border-primary bg-primary/5',
        className,
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}
    </div>
  )
}

type TaskColumnHeaderProps = React.ComponentProps<'div'>

export function TaskColumnHeader({ className, ...props }: TaskColumnHeaderProps) {
  return (
    <div
      className={cn('flex shrink-0 items-center gap-2 border-b border-border/60 p-3', className)}
      {...props}
    />
  )
}

type TaskColumnBodyProps = React.ComponentProps<'div'>

export function TaskColumnBody({ className, ...props }: TaskColumnBodyProps) {
  return (
    <div
      className={cn('min-h-0 flex-1 space-y-2 overflow-y-auto p-2', className)}
      {...props}
    />
  )
}

type TaskColumnFooterProps = React.ComponentProps<'div'>

export function TaskColumnFooter({ className, ...props }: TaskColumnFooterProps) {
  return <div className={cn('shrink-0 p-2', className)} {...props} />
}
