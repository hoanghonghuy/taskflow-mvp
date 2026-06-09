'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { MenuIcon, StopwatchIcon, ListBulletIcon, CalendarDaysIcon, GridIcon, RepeatIcon, HourglassIcon, HomeIcon, ViewColumnsIcon } from '@/lib/icons'
import { useUser } from '@/components/providers/user-provider'
import Avatar from '@/components/ui/avatar'
import ProfileDropdown from '@/components/auth/profile-dropdown'
import { useI18n } from '@/lib/i18n/hooks'
import { useRouter, usePathname } from 'next/navigation'

interface NavButtonProps {
  label: string
  onClick: () => void
  isActive?: boolean
  children: React.ReactNode
  className?: string
}

function NavButton({ label, onClick, isActive, children, className }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className={`relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        isActive
          ? 'bg-primary/25 text-primary font-semibold ring-2 ring-primary/60 border border-primary/50 shadow-[0_5px_15px_rgba(0,0,0,0.35)]'
          : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
      } ${className || ''}`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-1 top-2 bottom-2 w-1 rounded-full transition-all ${
          isActive ? 'bg-primary opacity-100 scale-y-100' : 'opacity-0 scale-y-50'
        }`}
      />
      {children}
    </button>
  )
}

interface FeatureBarProps {
  onSidebarToggle: () => void
}

export default function FeatureBar({ onSidebarToggle }: FeatureBarProps) {
  const { user } = useUser()
  const { t } = useI18n()
  const router = useRouter()
  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setDropdownOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleClickOutside])

  const currentView = useMemo(() => {
    if (!pathname) {
      return 'dashboard'
    }
    if (pathname === '/dashboard' || pathname === '/') {
      return 'dashboard'
    }
    return pathname.slice(1)
  }, [pathname])

  const handleViewClick = (view: string) => {
    router.push(`/${view === 'dashboard' ? 'dashboard' : view}`)
  }

  return (
    <nav className="hidden md:flex flex-col shrink-0 w-16 h-full border-r border-border items-center py-4 justify-between bg-card">
      <div className="flex flex-col items-center gap-2">
        <NavButton label={t('feature.toggleSidebar')} onClick={onSidebarToggle}>
          <MenuIcon className="h-6 w-6" />
        </NavButton>

        <div className="border-b w-8 my-2 border-border"></div>

        <NavButton label={t('feature.dashboard')} onClick={() => handleViewClick('dashboard')} isActive={currentView === 'dashboard'}>
          <HomeIcon className="h-6 w-6" />
        </NavButton>
        <NavButton label={t('feature.listView')} onClick={() => handleViewClick('list')} isActive={currentView === 'list'}>
          <ListBulletIcon className="h-6 w-6" />
        </NavButton>
        <NavButton label={t('feature.boardView')} onClick={() => handleViewClick('board')} isActive={currentView === 'board'}>
          <ViewColumnsIcon className="h-6 w-6" />
        </NavButton>
        <NavButton label={t('feature.calendarView')} onClick={() => handleViewClick('calendar')} isActive={currentView === 'calendar'}>
          <CalendarDaysIcon className="h-6 w-6" />
        </NavButton>
        <NavButton label={t('feature.matrixView')} onClick={() => handleViewClick('matrix')} isActive={currentView === 'matrix'}>
          <GridIcon className="h-6 w-6" />
        </NavButton>
        <NavButton label={t('feature.habitTracker')} onClick={() => handleViewClick('habits')} isActive={currentView === 'habits'}>
          <RepeatIcon className="h-6 w-6" />
        </NavButton>
        <NavButton label={t('feature.pomodoro')} onClick={() => handleViewClick('pomodoro')} isActive={currentView === 'pomodoro'}>
          <StopwatchIcon className="h-6 w-6" />
        </NavButton>
        <NavButton label={t('feature.countdown')} onClick={() => handleViewClick('countdown')} isActive={currentView === 'countdown'}>
          <HourglassIcon className="h-6 w-6" />
        </NavButton>
      </div>
      
      <div ref={dropdownRef} className="relative flex flex-col items-center">
        <div className="border-b w-8 my-2 border-border"></div>
        <button onClick={() => setDropdownOpen(prev => !prev)} className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
          <Avatar user={user} className="w-10 h-10" />
        </button>
        {isDropdownOpen && <ProfileDropdown user={user} onClose={() => setDropdownOpen(false)} />}
      </div>
    </nav>
  )
}

