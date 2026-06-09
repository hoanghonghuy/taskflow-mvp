'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n/hooks'
import { useUser } from '@/components/providers/user-provider'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, ArrowLeft, Shield } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin/dashboard', labelKey: 'admin.nav.dashboard' as const, icon: LayoutDashboard },
  { href: '/admin/users', labelKey: 'admin.nav.users' as const, icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { t } = useI18n()
  const { user } = useUser()

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card p-4 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('admin.title')}
          </p>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{t('admin.subtitle')}</p>
        <p className="text-xs text-muted-foreground mt-2">{t('admin.singletonNote')}</p>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || (pathname?.startsWith(`${href}/`) ?? false)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {t(labelKey)}
            </Link>
          )
        })}
      </nav>

      {user && (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
          <p className="text-muted-foreground">{t('admin.signedInAs')}</p>
          <p className="font-medium truncate mt-0.5">{user.name}</p>
          <p className="text-muted-foreground truncate">{user.email}</p>
        </div>
      )}

      <Link
        href="/dashboard"
        className="mt-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('admin.backToApp')}
      </Link>
    </aside>
  )
}
