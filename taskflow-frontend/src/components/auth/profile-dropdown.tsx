'use client'

import React from 'react'
import { useUser } from '@/components/providers/user-provider'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import type { User } from '@/types'
import { SettingsIcon, ArrowLeftOnRectangleIcon, TrophyIcon, UserCircleIcon } from '@/lib/constants'
import Avatar from '@/components/ui/avatar'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useRouter } from 'next/navigation'

interface ProfileDropdownProps {
  user: User | null
  onClose: () => void
}

export default function ProfileDropdown({ user, onClose }: ProfileDropdownProps) {
  const { logout } = useUser()
  const { dispatch } = useTaskManager()
  const { t } = useI18n()
  const router = useRouter()

  const handleViewProfileClick = () => {
    router.push('/profile')
    onClose()
  }

  const handleSettingsClick = () => {
    router.push('/settings')
    onClose()
  }

  const handleAchievementsClick = () => {
    router.push('/achievements')
    onClose()
  }

  const handleLogoutClick = () => {
    logout()
    onClose()
  }

  if (!user) return null

  return (
    <div className="
      absolute bottom-full mb-2 md:bottom-4 md:left-full md:ml-2 md:mb-0
      w-64 bg-popover rounded-lg shadow-2xl border border-border
      animate-fade-in
      origin-bottom md:origin-bottom-left z-50
    ">
      <button
        onClick={handleViewProfileClick}
        className="w-full text-left p-4 border-b border-border flex items-center gap-3 hover:bg-secondary transition-colors"
      >
        <Avatar user={user} className="w-10 h-10 flex-shrink-0" />
        <div className="overflow-hidden">
          <p className="font-semibold text-sm truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </button>
      <div className="p-2">
        <button
          onClick={handleViewProfileClick}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-secondary"
        >
          <UserCircleIcon className="w-5 h-5 text-muted-foreground" />
          <span>{t('profile.viewProfile')}</span>
        </button>
        <button
          onClick={handleSettingsClick}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-secondary"
        >
          <SettingsIcon className="w-5 h-5 text-muted-foreground" />
          <span>{t('profile.settings')}</span>
        </button>
        <button
          onClick={handleAchievementsClick}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-secondary"
        >
          <TrophyIcon className="w-5 h-5 text-muted-foreground" />
          <span>{t('profile.achievements')}</span>
        </button>
      </div>
      <div className="p-2 border-t border-border">
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-secondary"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 text-muted-foreground" />
          <span>{t('profile.logout')}</span>
        </button>
      </div>
    </div>
  )
}

