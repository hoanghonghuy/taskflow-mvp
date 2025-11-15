'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MenuIcon, StopwatchIcon, ListBulletIcon, CalendarDaysIcon, GridIcon, RepeatIcon, HourglassIcon, HomeIcon, ViewColumnsIcon } from '@/lib/constants'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import { useUser } from '@/components/providers/user-provider'
import Avatar from '@/components/ui/avatar'
import ProfileDropdown from '@/components/auth/profile-dropdown'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useRouter, usePathname } from 'next/navigation'

interface FeatureBarProps {
  onSidebarToggle: () => void
}

export default function FeatureBar({ onSidebarToggle }: FeatureBarProps) {
  const { state, dispatch } = useTaskManager()
  const { user } = useUser()
  const { t } = useI18n()
  const router = useRouter()
  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const [currentView, setCurrentView] = useState<string>('dashboard')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Update currentView only on client side to avoid hydration mismatch
  useEffect(() => {
    if (pathname === '/dashboard' || pathname === '/') {
      setCurrentView('dashboard')
    } else {
      setCurrentView(pathname.slice(1))
    }
  }, [pathname])

  const handleViewClick = (view: string) => {
    router.push(`/${view === 'dashboard' ? 'dashboard' : view}`)
  }
  
  const NavButton: React.FC<{
    label: string
    onClick: () => void
    isActive?: boolean
    children: React.ReactNode
    className?: string
  }> = ({ label, onClick, isActive, children, className }) => (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      } ${className || ''}`}
    >
      {children}
    </button>
  )

  return (
    <nav className="hidden md:flex flex-col flex-shrink-0 w-16 h-full border-r border-border items-center py-4 justify-between bg-card">
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

