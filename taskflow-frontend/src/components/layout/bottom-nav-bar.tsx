'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import { useSettings } from '@/components/providers/settings-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { StopwatchIcon, ListBulletIcon, CalendarDaysIcon, GridIcon, RepeatIcon, HourglassIcon, HomeIcon, ViewColumnsIcon } from '@/lib/constants'
import type { View } from '@/types'
import { useRouter, usePathname } from 'next/navigation'

const ALL_FEATURES: { view: View, icon: React.FC<{className?: string}>, label: string }[] = [
  { view: 'dashboard', icon: HomeIcon, label: 'feature.dashboard' },
  { view: 'list', icon: ListBulletIcon, label: 'feature.listView' },
  { view: 'board', icon: ViewColumnsIcon, label: 'feature.boardView' },
  { view: 'calendar', icon: CalendarDaysIcon, label: 'feature.calendarView' },
  { view: 'matrix', icon: GridIcon, label: 'feature.matrixView' },
  { view: 'habit', icon: RepeatIcon, label: 'feature.habitTracker' },
  { view: 'pomodoro', icon: StopwatchIcon, label: 'feature.pomodoro' },
  { view: 'countdown', icon: HourglassIcon, label: 'feature.countdown' },
]

const MoreMenu: React.FC<{ hiddenViews: View[], onClose: () => void }> = ({ hiddenViews, onClose }) => {
  const router = useRouter()
  const { t } = useI18n()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleSelect = (view: View) => {
    router.push(`/${view === 'dashboard' ? 'dashboard' : view}`)
    onClose()
  }

  return (
    <div ref={menuRef} className="absolute bottom-full right-0 mb-2 w-48 bg-popover rounded-lg shadow-2xl border border-border animate-fade-in p-2">
      <div className="space-y-1">
        {hiddenViews.map(view => {
          const feature = ALL_FEATURES.find(f => f.view === view)
          if (!feature) return null
          const Icon = feature.icon
          return (
            <button 
              key={view} 
              onClick={() => handleSelect(view)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-secondary"
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span>{t(feature.label)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function BottomNavBar() {
  const { settings } = useSettings()
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  const bottomNavActions = settings.bottomNavActions || ['dashboard', 'list', 'board', 'calendar']
  const visibleFeatures = ALL_FEATURES.filter(f => bottomNavActions.includes(f.view))
  const hiddenFeatures = ALL_FEATURES.filter(f => !bottomNavActions.includes(f.view)).map(f => f.view)
  
  const getCurrentView = () => {
    if (pathname === '/dashboard' || pathname === '/') return 'dashboard'
    return pathname.slice(1) as View
  }

  const currentView = getCurrentView()

  const NavButton: React.FC<{
    feature: typeof ALL_FEATURES[0]
    isActive: boolean
  }> = ({ feature, isActive }) => {
    const Icon = feature.icon
    return (
      <button
        onClick={() => router.push(`/${feature.view === 'dashboard' ? 'dashboard' : feature.view}`)}
        className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors p-1 ${
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon className="h-6 w-6" />
        <span className="text-[10px] font-medium">{t(feature.label)}</span>
      </button>
    )
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-lg border-t border-border flex items-stretch justify-around z-30">
      {visibleFeatures.map(feature => (
        <NavButton key={feature.view} feature={feature} isActive={currentView === feature.view} />
      ))}
      {hiddenFeatures.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setIsMoreMenuOpen(p => !p)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors p-1 h-full w-16 ${
              isMoreMenuOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            <span className="text-[10px] font-medium">{t('feature.more')}</span>
          </button>
          {isMoreMenuOpen && <MoreMenu hiddenViews={hiddenFeatures} onClose={() => setIsMoreMenuOpen(false)} />}
        </div>
      )}
    </nav>
  )
}

