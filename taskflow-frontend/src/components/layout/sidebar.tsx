'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ListTodo, 
  LayoutGrid, 
  Calendar, 
  Grid3x3, 
  Repeat, 
  Timer, 
  Clock,
  Trophy,
  User,
  Settings,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useUser } from '@/components/providers/user-provider'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/hooks/use-i18n'

const navItems = [
  { icon: LayoutDashboard, label: 'nav.dashboard', href: '/dashboard' },
  { icon: ListTodo, label: 'nav.list', href: '/list' },
  { icon: LayoutGrid, label: 'nav.board', href: '/board' },
  { icon: Calendar, label: 'nav.calendar', href: '/calendar' },
  { icon: Grid3x3, label: 'nav.matrix', href: '/matrix' },
  { icon: Repeat, label: 'nav.habits', href: '/habits' },
  { icon: Timer, label: 'nav.pomodoro', href: '/pomodoro' },
  { icon: Clock, label: 'nav.countdown', href: '/countdown' },
  { icon: Trophy, label: 'nav.achievements', href: '/achievements' },
]

const bottomNavItems = [
  { icon: User, label: 'nav.profile', href: '/profile' },
  { icon: Settings, label: 'nav.settings', href: '/settings' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useUser()
  const router = useRouter()
  const { t } = useI18n()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
      <aside className={`
        fixed md:relative inset-y-0 left-0 bg-card flex flex-col shrink-0 z-30 
        w-64 transition-transform md:transition-all duration-300 ease-in-out overflow-hidden border-border
        ${isOpen 
          ? 'p-4 border-r translate-x-0 md:w-64'
          : 'p-4 -translate-x-full md:w-0 md:p-0 md:border-r-0 md:translate-x-0'
        }
      `}>
        {/* Logo */}
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => window.innerWidth < 768 && onClose()}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">T</span>
            </div>
            <span className="font-bold text-xl">{t('app.name')}</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link key={item.href} href={item.href} onClick={() => window.innerWidth < 768 && onClose()}>
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{t(item.label)}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link key={item.href} href={item.href} onClick={() => window.innerWidth < 768 && onClose()}>
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{t(item.label)}</span>
                </div>
              </Link>
            )
          })}

          {/* User info & Logout */}
          <div className="pt-2 border-t mt-2">
            <div className="flex items-center gap-2 px-3 py-2 text-sm">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-semibold">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span>{t('auth.logout')}</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
