import * as React from 'react'

import { cn } from '@/lib/utils'

/** Shared control chrome — mirrors shadcn Input (border-input + focus ring). */
const fieldControlClassName = [
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
  'transition-colors placeholder:text-muted-foreground',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'read-only:opacity-80',
].join(' ')

type PropertyListProps = React.ComponentProps<'div'> & {
  title?: React.ReactNode
  children: React.ReactNode
}

/** Flat property block — border + divide like shadcn Card/Table. */
function PropertyList({ title, className, children, ...props }: PropertyListProps) {
  return (
    <div
      data-slot="property-list"
      className={cn('overflow-hidden rounded-lg border border-border bg-card', className)}
      {...props}
    >
      {title ? (
        <div className="border-b border-border px-3 py-2">
          <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        </div>
      ) : null}
      <div className="divide-y divide-border">{children}</div>
    </div>
  )
}

type PropertyRowProps = {
  label: React.ReactNode
  children: React.ReactNode
  className?: string
  align?: 'center' | 'start'
  labelClassName?: string
}

/** One property row: fixed label column + flexible control. */
function PropertyRow({
  label,
  children,
  className,
  align = 'center',
  labelClassName,
}: PropertyRowProps) {
  return (
    <div
      data-slot="property-row"
      className={cn(
        'grid gap-2 px-3 py-3 sm:grid-cols-[7.5rem_minmax(0,1fr)]',
        align === 'center' ? 'sm:items-center' : 'sm:items-start',
        className,
      )}
    >
      <span
        className={cn(
          'text-sm text-muted-foreground',
          align === 'start' && 'sm:pt-2',
          labelClassName,
        )}
      >
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

type DetailSectionProps = {
  title: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  /** When true, omit default content padding (e.g. full-bleed textarea). */
  flush?: boolean
}

/** Titled content block with hairline header (tags, subtasks, comments). */
function DetailSection({
  title,
  action,
  children,
  className,
  contentClassName,
  flush = false,
}: DetailSectionProps) {
  return (
    <section
      data-slot="detail-section"
      className={cn('overflow-hidden rounded-lg border border-border bg-card', className)}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn(!flush && 'px-3 py-3', contentClassName)}>{children}</div>
    </section>
  )
}

type MetaChipProps = {
  children: React.ReactNode
  className?: string
}

function MetaChip({ children, className }: MetaChipProps) {
  return (
    <span
      data-slot="meta-chip"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-input bg-secondary px-2 py-0.5 text-xs text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

export {
  DetailSection,
  MetaChip,
  PropertyList,
  PropertyRow,
  fieldControlClassName,
}
