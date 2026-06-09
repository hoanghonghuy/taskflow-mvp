'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n/hooks'
import { useConfirmation } from '@/components/providers/confirmation-provider'
import { useToast } from '@/lib/hooks/use-toast'
import * as adminApi from '@/lib/api/admin'

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>()
  const userId = params?.id
  const router = useRouter()
  const { t } = useI18n()
  const { confirm } = useConfirmation()
  const { success, error } = useToast()
  const [user, setUser] = useState<adminApi.AdminUserDetail | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!userId) {
        if (!cancelled) setLoading(false)
        return
      }

      try {
        const data = await adminApi.fetchAdminUser(userId)
        if (!cancelled) {
          setUser(data)
          setName(data.name)
          setEmail(data.email)
        }
      } catch (err) {
        console.error('Failed to load admin user', err)
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
  }, [userId, error, t])

  const isSystemAdmin = user?.role === 'ADMIN'
  const hasChanges = user ? name.trim() !== user.name || email.trim().toLowerCase() !== user.email : false

  const handleSave = async () => {
    if (!user || isSystemAdmin || !hasChanges) return

    setSaving(true)
    try {
      const updated = await adminApi.updateAdminUser(user.id, {
        name: name.trim(),
        email: email.trim(),
      })
      setUser((prev) => (prev ? { ...prev, ...updated } : prev))
      setName(updated.name)
      setEmail(updated.email)
      success(t('admin.userDetail.savedTitle'), t('admin.userDetail.savedBody'))
    } catch {
      error(t('admin.userDetail.saveFailedTitle'), t('admin.userDetail.saveFailedBody'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || isSystemAdmin) return

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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <Badge variant={isSystemAdmin ? 'default' : 'secondary'}>
              {isSystemAdmin ? t('admin.roles.admin') : t('admin.roles.user')}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
        </div>
        <Link href="/admin/users" className="text-sm text-primary hover:underline">
          {t('admin.userDetail.back')}
        </Link>
      </div>

      {isSystemAdmin && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{t('admin.userDetail.protectedTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('admin.userDetail.protectedBody')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t('admin.userDetail.role')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {isSystemAdmin ? t('admin.roles.admin') : t('admin.roles.user')}
            </p>
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
          <p>{t('admin.userDetail.countdowns', { count: user.countdownCount })}</p>
        </CardContent>
      </Card>

      {!isSystemAdmin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('admin.userDetail.editTitle')}</CardTitle>
              <p className="text-sm text-muted-foreground">{t('admin.userDetail.editSubtitle')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="admin-user-name" className="text-sm font-medium">
                  {t('admin.userDetail.nameLabel')}
                </label>
                <Input
                  id="admin-user-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="admin-user-email" className="text-sm font-medium">
                  {t('admin.userDetail.emailLabel')}
                </label>
                <Input
                  id="admin-user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                />
              </div>
              <Button disabled={saving || !hasChanges} onClick={() => void handleSave()}>
                {t('admin.userDetail.save')}
              </Button>
            </CardContent>
          </Card>

          <Button variant="destructive" disabled={saving} onClick={() => void handleDelete()}>
            {t('admin.userDetail.delete')}
          </Button>
        </>
      )}
    </div>
  )
}
