'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  UserRound,
  ListTodo,
  Repeat,
  List,
  Timer,
  CalendarClock,
  UserPlus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { useI18n } from '@/lib/i18n/hooks'
import { useToast } from '@/lib/hooks/use-toast'
import * as adminApi from '@/lib/api/admin'

export default function AdminDashboardPage() {
  const { t } = useI18n()
  const { error } = useToast()
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
        if (!cancelled) {
          error(t('admin.errors.loadFailedTitle'), t('admin.errors.loadFailedBody'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [error, t])

  const statCards = [
    { key: 'totalUsers', label: t('admin.stats.totalUsers'), value: stats?.totalUsers, icon: Users },
    { key: 'regularUsers', label: t('admin.stats.regularUsers'), value: stats?.regularUsers, icon: UserRound },
    { key: 'newUsersLast7Days', label: t('admin.stats.newUsersLast7Days'), value: stats?.newUsersLast7Days, icon: UserPlus },
    { key: 'totalTasks', label: t('admin.stats.totalTasks'), value: stats?.totalTasks, icon: ListTodo },
    { key: 'totalHabits', label: t('admin.stats.totalHabits'), value: stats?.totalHabits, icon: Repeat },
    { key: 'totalLists', label: t('admin.stats.totalLists'), value: stats?.totalLists, icon: List },
    { key: 'totalPomodoro', label: t('admin.stats.totalPomodoro'), value: stats?.totalPomodoroSessions, icon: Timer },
    { key: 'totalCountdowns', label: t('admin.stats.totalCountdowns'), value: stats?.totalCountdowns, icon: CalendarClock },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t('admin.dashboard.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('admin.dashboard.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <AdminStatCard
            key={card.key}
            label={card.label}
            value={card.value}
            loading={loading}
            icon={card.icon}
          />
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{t('admin.dashboard.recentUsersTitle')}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('admin.dashboard.recentUsersSubtitle')}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/users">{t('admin.dashboard.viewAllUsers')}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : stats?.recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.dashboard.noRecentUsers')}</p>
          ) : (
            <div className="divide-y divide-border">
              {stats?.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {user.role === 'ADMIN' ? t('admin.roles.admin') : t('admin.roles.user')}
                    </Badge>
                    {user.role === 'USER' && (
                      <Link href={`/admin/users/${user.id}`} className="text-sm text-primary hover:underline">
                        {t('admin.users.view')}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
