'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { MenuIcon } from '@/lib/icons'
import { useUser } from '@/components/providers/user-provider'
import Avatar from '@/components/ui/avatar'
import ProfileDropdown from '@/components/auth/profile-dropdown'
import { useI18n } from '@/lib/i18n/hooks'
import { APP_FEATURES, getPathForView, getViewFromPathname } from '@/lib/navigation/features'
import type { View } from '@/types'
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
      className={`relative w-12 h-12 flex items-center justify-center rounded-xl transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        isActive
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      } ${className || ''}`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-1.5 top-3 bottom-3 w-0.5 rounded-full bg-foreground transition-opacity ${
          isActive ? 'opacity-100' : 'opacity-0'
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

  const currentView = useMemo(() => getViewFromPathname(pathname), [pathname])

  const handleViewClick = (view: View) => {
    router.push(getPathForView(view))
  }

  return (
    <nav className="hidden md:flex flex-col shrink-0 w-16 h-full overflow-y-auto border-r border-border items-center py-4 justify-between bg-card">
      <div className="flex flex-col items-center gap-2">
        <NavButton label={t('feature.toggleSidebar')} onClick={onSidebarToggle}>
          <MenuIcon className="h-6 w-6" />
        </NavButton>

        <div className="border-b w-8 my-2 border-border"></div>

        {APP_FEATURES.map((feature) => {
          const Icon = feature.icon
          // Feature bar uses /habits path; View id is `habit`
          const pathActive =
            feature.view === 'habit'
              ? currentView === 'habit'
              : currentView === feature.view
          return (
            <NavButton
              key={feature.view}
              label={t(feature.label)}
              onClick={() => handleViewClick(feature.view)}
              isActive={pathActive}
            >
              <Icon className="h-6 w-6" />
            </NavButton>
          )
        })}
      </div>

      <div ref={dropdownRef} className="relative flex flex-col items-center">
        <div className="border-b w-8 my-2 border-border"></div>
        <button
          type="button"
          onClick={() => setDropdownOpen(prev => !prev)}
          className="p-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Avatar user={user} className="w-10 h-10" />
        </button>
        {isDropdownOpen && <ProfileDropdown user={user} onClose={() => setDropdownOpen(false)} />}
      </div>
    </nav>
  )
}
