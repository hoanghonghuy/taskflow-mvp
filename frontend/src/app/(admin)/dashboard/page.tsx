'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/hooks'
import * as adminApi from '@/lib/api/admin'

export default function AdminDashboardPage() {
  const { t } = useI18n()
  const [stats, setStats] = useState<adminApi.AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await adminApi.fetchAdminStats()
        if (!cancelled) setStats(data)
      } catch (err) {
        console.error('Failed to load admin stats', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const cards = [
    { key: 'totalUsers', label: t('admin.stats.totalUsers'), value: stats?.totalUsers },
    { key: 'totalTasks', label: t('admin.stats.totalTasks'), value: stats?.totalTasks },
    { key: 'totalHabits', label: t('admin.stats.totalHabits'), value: stats?.totalHabits },
    { key: 'newUsersLast7Days', label: t('admin.stats.newUsersLast7Days'), value: stats?.newUsersLast7Days },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('admin.dashboard.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('admin.dashboard.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {loading ? '—' : (card.value ?? 0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
