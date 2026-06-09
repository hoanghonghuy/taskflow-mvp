'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { LucideIcon } from 'lucide-react'

interface AdminStatCardProps {
  label: string
  value?: number
  loading?: boolean
  icon?: LucideIcon
}

export function AdminStatCard({ label, value, loading, icon: Icon }: AdminStatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <p className="text-3xl font-bold tabular-nums">{value ?? 0}</p>
        )}
      </CardContent>
    </Card>
  )
}
