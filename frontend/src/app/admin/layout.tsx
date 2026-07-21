'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/providers/user-provider'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { useI18n } from '@/lib/i18n/hooks'
import { useToast } from '@/lib/hooks/use-toast'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isAdmin, authReady } = useUser()
  const { t } = useI18n()
  const { error } = useToast()

  useEffect(() => {
    if (!authReady) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    if (!isAdmin) {
      error(t('admin.errors.forbiddenTitle'), t('admin.errors.forbiddenBody'))
      router.replace('/dashboard')
    }
  }, [authReady, isAuthenticated, isAdmin, router, error, t])

  if (!authReady || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex bg-background text-foreground">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
