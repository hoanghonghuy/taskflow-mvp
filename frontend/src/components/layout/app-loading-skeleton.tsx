import { Skeleton } from '@/components/ui/skeleton'

/** Minimal loading shell — layout chrome only, no loud accent blocks. */
export function AppLoadingSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
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
      <main className="flex min-w-0 flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="mb-3 h-7 w-40" />
        <Skeleton className="mb-8 h-3.5 w-56 max-w-full" />
        <div className="space-y-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-[94%]" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-[90%]" />
        </div>
      </main>
    </div>
  )
}
