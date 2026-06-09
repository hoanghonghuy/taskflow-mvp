'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/hooks'
import { useConfirmation } from '@/components/providers/confirmation-provider'
import { useToast } from '@/lib/hooks/use-toast'
import * as adminApi from '@/lib/api/admin'
import type { UserRole } from '@/types'

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { t } = useI18n()
  const { confirm } = useConfirmation()
  const { success, error } = useToast()
  const [user, setUser] = useState<adminApi.AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await adminApi.fetchAdminUser(params.id)
        if (!cancelled) setUser(data)
      } catch (err) {
        console.error('Failed to load admin user', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [params.id])

  const handleRoleChange = async (role: UserRole) => {
    if (!user) return
    setSaving(true)
    try {
      const updated = await adminApi.updateAdminUserRole(user.id, role)
      setUser((prev) => (prev ? { ...prev, role: updated.role } : prev))
      success(t('admin.userDetail.roleUpdatedTitle'), t('admin.userDetail.roleUpdatedBody'))
    } catch {
      error(t('admin.userDetail.roleUpdateFailedTitle'), t('admin.userDetail.roleUpdateFailedBody'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    const ok = await confirm({
      title: t('admin.userDetail.deleteConfirmTitle', { name: user.name }),
      description: t('admin.userDetail.deleteConfirmBody'),
      confirmText: t('admin.userDetail.delete'),
      variant: 'destructive',
    })
    if (!ok) return

    setSaving(true)
    try {
      await adminApi.deleteAdminUser(user.id)
      success(t('admin.userDetail.deletedTitle'), t('admin.userDetail.deletedBody'))
      router.push('/admin/users')
    } catch {
      error(t('admin.userDetail.deleteFailedTitle'), t('admin.userDetail.deleteFailedBody'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">{t('admin.userDetail.loading')}</p>
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t('admin.userDetail.notFound')}</p>
        <Link href="/admin/users" className="text-primary hover:underline">
          {t('admin.userDetail.back')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
        </div>
        <Link href="/admin/users" className="text-sm text-primary hover:underline">
          {t('admin.userDetail.back')}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t('admin.userDetail.role')}</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              size="sm"
              variant={user.role === 'USER' ? 'default' : 'outline'}
              disabled={saving || user.role === 'USER'}
              onClick={() => handleRoleChange('USER')}
            >
              {t('admin.roles.user')}
            </Button>
            <Button
              size="sm"
              variant={user.role === 'ADMIN' ? 'default' : 'outline'}
              disabled={saving || user.role === 'ADMIN'}
              onClick={() => handleRoleChange('ADMIN')}
            >
              {t('admin.roles.admin')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t('admin.userDetail.createdAt')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{new Date(user.createdAt).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.userDetail.activity')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <p>{t('admin.userDetail.tasks', { count: user.taskCount })}</p>
          <p>{t('admin.userDetail.habits', { count: user.habitCount })}</p>
          <p>{t('admin.userDetail.lists', { count: user.listCount })}</p>
          <p>{t('admin.userDetail.pomodoro', { count: user.pomodoroSessionCount })}</p>
        </CardContent>
      </Card>

      <Button variant="destructive" disabled={saving} onClick={handleDelete}>
        {t('admin.userDetail.delete')}
      </Button>
    </div>
  )
}
