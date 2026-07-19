import { PageSkeleton } from '@/components/layout/page-skeleton'

/** Fallback when a child route has no dedicated loading.tsx — content only (layout chrome stays). */
export default function AppLoading() {
  return <PageSkeleton variant="default" />
}
