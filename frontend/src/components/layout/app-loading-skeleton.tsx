import { Skeleton } from '@/components/ui/skeleton'
import {
  PageSkeleton,
  resolvePageSkeletonVariant,
  type PageSkeletonVariant,
} from '@/components/layout/page-skeleton'

type AppLoadingSkeletonProps = {
  /** When omitted, uses list-like default content. Pass pathname-based variant from layout. */
  variant?: PageSkeletonVariant
}

/** Full-screen shell for auth / hydrate — chrome + page-matched content. */
export function AppLoadingSkeleton({ variant = 'default' }: AppLoadingSkeletonProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden w-14 shrink-0 border-r border-border md:block" aria-hidden />
      <aside className="hidden w-64 shrink-0 border-r border-border p-4 md:block" aria-hidden>
        <div className="mb-8 flex items-center gap-3 px-1">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-[88%]" />
          <Skeleton className="h-8 w-[72%]" />
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden py-2 sm:py-4">
        <PageSkeleton variant={variant} />
      </main>
    </div>
  )
}

export { resolvePageSkeletonVariant }
export type { PageSkeletonVariant }
