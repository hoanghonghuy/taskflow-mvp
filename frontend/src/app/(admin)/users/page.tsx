'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/hooks'
import * as adminApi from '@/lib/api/admin'

export default function AdminUsersPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<adminApi.AdminUserList | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminApi.fetchAdminUsers({ page, pageSize: 20, search: query || undefined })
      setData(result)
    } catch (err) {
      console.error('Failed to load admin users', err)
    } finally {
      setLoading(false)
    }
  }, [page, query])

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

      <form
        className="flex gap-2 max-w-md"
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
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {t('admin.users.loading')}
                </td>
              </tr>
            )}
            {!loading && data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {t('admin.users.empty')}
                </td>
              </tr>
            )}
            {!loading && data?.items.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {user.role === 'ADMIN' ? t('admin.roles.admin') : t('admin.roles.user')}
                  </span>
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
