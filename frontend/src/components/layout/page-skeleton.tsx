import type { ReactNode } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export type PageSkeletonVariant =
  | 'dashboard'
  | 'list'
  | 'board'
  | 'calendar'
  | 'matrix'
  | 'habits'
  | 'pomodoro'
  | 'countdown'
  | 'settings'
  | 'profile'
  | 'achievements'
  | 'default'

const PATH_VARIANTS: Record<string, PageSkeletonVariant> = {
  dashboard: 'dashboard',
  list: 'list',
  board: 'board',
  calendar: 'calendar',
  matrix: 'matrix',
  habits: 'habits',
  pomodoro: 'pomodoro',
  countdown: 'countdown',
  settings: 'settings',
  profile: 'profile',
  achievements: 'achievements',
}

/** Map pathname → page skeleton layout. */
export function resolvePageSkeletonVariant(pathname: string | null | undefined): PageSkeletonVariant {
  if (!pathname || pathname === '/') return 'dashboard'
  const segment = pathname.replace(/^\//, '').split('/')[0] || 'dashboard'
  return PATH_VARIANTS[segment] ?? 'default'
}

function PageHeaderSkeleton({
  withActions = false,
  wide = false,
}: {
  withActions?: boolean
  wide?: boolean
}) {
  return (
    <div
      className={cn(
        'mb-6 hidden shrink-0 border-b border-border pb-6 md:block',
        wide ? 'max-w-none' : '',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
        {withActions ? <Skeleton className="h-9 w-28 shrink-0 rounded-lg" /> : null}
      </div>
    </div>
  )
}

function TaskRowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-11 w-full"
          style={{ width: `${94 - (i % 3) * 4}%` }}
        />
      ))}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 py-6">
      <div className="mb-2 hidden space-y-2 md:block">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 rounded-lg border border-border bg-card p-5">
                <Skeleton className="size-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <Skeleton className="mb-4 h-5 w-40" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            <TaskRowsSkeleton count={4} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="py-4 md:py-6">
      <PageHeaderSkeleton withActions />
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
      <TaskRowsSkeleton count={6} />
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="py-4 md:py-6 md:max-w-none">
      <PageHeaderSkeleton withActions wide />
      <div className="flex flex-col gap-4 md:flex-row md:gap-6 md:overflow-hidden">
        {Array.from({ length: 3 }).map((_, col) => (
          <div
            key={col}
            className="flex w-full flex-col rounded-xl border border-border bg-card p-3 md:w-72 md:shrink-0"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-7 rounded-full" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 + (col % 2) }).map((_, row) => (
                <Skeleton key={row} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4 py-4 md:space-y-6 md:py-6">
      <PageHeaderSkeleton withActions />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-7 border-b border-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex justify-center py-2">
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-16 border-b border-r border-border p-1.5 md:min-h-24">
              <Skeleton className="mb-2 h-3 w-5" />
              {i % 5 === 0 ? <Skeleton className="h-4 w-full rounded" /> : null}
              {i % 7 === 2 ? <Skeleton className="mt-1 h-4 w-[80%] rounded" /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MatrixSkeleton() {
  return (
    <div className="h-full py-4 md:max-w-none md:py-6">
      <PageHeaderSkeleton wide />
      <div className="grid h-[min(70vh,640px)] grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex min-h-[200px] flex-col rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Skeleton className="size-2.5 rounded-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="ml-auto h-5 w-7 rounded-full" />
            </div>
            <div className="space-y-2 p-3">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-[90%] rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HabitsSkeleton() {
  return (
    <div className="space-y-6 py-4 md:py-6">
      <PageHeaderSkeleton withActions />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Skeleton className="size-2.5 rounded-full" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <Skeleton className="h-8 w-14" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3.5 w-32" />
              </div>
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
            <div className="flex gap-1.5 overflow-hidden">
              {Array.from({ length: 14 }).map((_, d) => (
                <Skeleton key={d} className="size-6 shrink-0 rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PomodoroSkeleton() {
  return (
    <div className="py-4 md:py-8">
      <PageHeaderSkeleton />
      <div className="flex h-full flex-col gap-8 lg:flex-row">
        <div className="flex flex-1 flex-col items-center justify-center lg:justify-start">
          <Skeleton className="mb-4 h-5 w-28" />
          <Skeleton className="mb-8 size-56 rounded-full sm:size-64" />
          <div className="flex gap-3">
            <Skeleton className="h-11 w-28 rounded-lg" />
            <Skeleton className="h-11 w-11 rounded-lg" />
          </div>
        </div>
        <div className="w-full space-y-4 lg:w-80 lg:shrink-0">
          <Skeleton className="h-5 w-36" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-secondary/50 p-4">
                <Skeleton className="mb-2 h-3 w-16" />
                <Skeleton className="h-7 w-12" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CountdownSkeleton() {
  return (
    <div className="space-y-8 py-4 md:py-6">
      <PageHeaderSkeleton withActions />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="size-8 rounded-full" />
            </div>
            <Skeleton className="mb-2 h-10 w-24" />
            <Skeleton className="h-3.5 w-40" />
          </div>
        ))}
      </div>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-8 py-4 md:py-6">
      <PageHeaderSkeleton />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="max-w-xl rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-48" />
              </div>
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6 py-4 md:py-6">
      <PageHeaderSkeleton />
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6 space-y-2">
            <div className="mb-1 flex items-center gap-3">
              <Skeleton className="size-6 rounded" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

function AchievementsSkeleton() {
  return (
    <div className="py-4 md:py-6">
      <div className="mb-6 hidden space-y-2 md:block">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-lg border border-border bg-card p-6 text-center"
          >
            <Skeleton className="mb-4 size-14 rounded-full" />
            <Skeleton className="mb-2 h-5 w-32" />
            <Skeleton className="h-3.5 w-40" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DefaultSkeleton() {
  return (
    <div className="py-6">
      <Skeleton className="mb-3 h-7 w-40" />
      <Skeleton className="mb-8 h-3.5 w-56 max-w-full" />
      <TaskRowsSkeleton count={5} />
    </div>
  )
}

const VARIANT_RENDERERS: Record<PageSkeletonVariant, () => ReactNode> = {
  dashboard: DashboardSkeleton,
  list: ListSkeleton,
  board: BoardSkeleton,
  calendar: CalendarSkeleton,
  matrix: MatrixSkeleton,
  habits: HabitsSkeleton,
  pomodoro: PomodoroSkeleton,
  countdown: CountdownSkeleton,
  settings: SettingsSkeleton,
  profile: ProfileSkeleton,
  achievements: AchievementsSkeleton,
  default: DefaultSkeleton,
}

type PageSkeletonProps = {
  variant?: PageSkeletonVariant
  className?: string
}

/** Content-area skeleton matching each feature page layout (no app chrome). */
export function PageSkeleton({ variant = 'default', className }: PageSkeletonProps) {
  const Renderer = VARIANT_RENDERERS[variant] ?? DefaultSkeleton
  return (
    <div
      className={cn(
        'flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden px-4 sm:px-6 lg:px-8',
        (variant === 'board' || variant === 'matrix') && 'max-w-none',
        className,
      )}
      aria-busy="true"
      aria-label="Loading"
    >
      <Renderer />
    </div>
  )
}
