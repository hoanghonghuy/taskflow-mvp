'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useI18n } from '@/lib/i18n/hooks'
import { useToast } from '@/lib/hooks/use-toast'
import * as adminApi from '@/lib/api/admin'

export default function AdminUsersPage() {
  const { t } = useI18n()
  const { error } = useToast()
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<adminApi.AdminUserList | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminApi.fetchAdminUsers({
        page,
        pageSize: 20,
        search: query || undefined,
        role: 'USER',
      })
      setData(result)
    } catch (err) {
      console.error('Failed to load admin users', err)
      error(t('admin.errors.loadFailedTitle'), t('admin.errors.loadFailedBody'))
    } finally {
      setLoading(false)
    }
  }, [page, query, error, t])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('admin.users.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('admin.users.subtitle')}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 max-w-2xl">
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            setQuery(search.trim())
          }}
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.users.searchPlaceholder')}
          />
          <Button type="submit">{t('admin.users.search')}</Button>
        </form>
        <Button variant="outline" disabled={loading} onClick={() => void loadUsers()}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.users.refresh')}
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">{t('admin.users.columns.name')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('admin.users.columns.email')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('admin.users.columns.role')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('admin.users.columns.createdAt')}</th>
              <th className="text-right px-4 py-3 font-medium">{t('admin.users.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="ml-auto h-4 w-12" /></td>
                </tr>
              ))}
            {!loading && data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {t('admin.users.empty')}
                </td>
              </tr>
            )}
            {!loading && data?.items.map((user) => (
              <tr key={user.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">{t('admin.roles.user')}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/users/${user.id}`} className="text-primary hover:underline">
                    {t('admin.users.view')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('admin.users.pagination', { page, totalPages, total: data?.total ?? 0 })}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('admin.users.prev')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('admin.users.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
