'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useUser } from '@/components/providers/user-provider'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { Avatar } from '@/components/ui/avatar'
import { CalendarIcon, CheckCircleIcon, ClockIcon, TrophyIcon } from 'lucide-react'
import { toYYYYMMDD } from '@/lib/utils/date-helpers'
import { AppPage, AppPageContainer, AppPageMain } from '@/components/layout/app-page'

type ProfileSummary = {
  totalTasks: number
  completedTasks: number
  completionRate: number
  totalHabits: number
  completedHabitsToday: number
  totalFocusTime: number
  totalPomos: number
  unlockedAchievements: number
}

const ProfileView: React.FC = () => {
  const { user } = useUser()
  const { state } = useTaskManager()
  const { t } = useI18n()

  const localStats = useMemo<ProfileSummary>(() => {
    const totalTasks = state.tasks.length
    const completedTasks = state.tasks.filter(t => t.completed).length
    const totalHabits = state.habits.length
    const today = toYYYYMMDD(new Date())
    const completedHabitsToday = state.habits.filter(h => h.completions.includes(today)).length
    const totalFocusTime = state.pomodoro.focusHistory.reduce((acc, curr) => acc + curr.duration, 0)
    const totalPomos = state.pomodoro.focusHistory.length
    const unlockedAchievements = state.unlockedAchievements?.length || 0

    return {
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalHabits,
      completedHabitsToday,
      totalFocusTime,
      totalPomos,
      unlockedAchievements,
    }
  }, [state])

  const [remoteStats, setRemoteStats] = useState<ProfileSummary | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadProfileSummary = async () => {
      try {
        const response = await fetch('/api/profile/summary', { method: 'GET', credentials: 'include' })
        if (!response.ok) {
          return
        }
        const data = (await response.json().catch(() => null)) as Partial<ProfileSummary> | null
        if (!data || !isMounted) return

        setRemoteStats(prev => ({
          totalTasks: data.totalTasks ?? prev?.totalTasks ?? localStats.totalTasks,
          completedTasks: data.completedTasks ?? prev?.completedTasks ?? localStats.completedTasks,
          completionRate: data.completionRate ?? prev?.completionRate ?? localStats.completionRate,
          totalHabits: data.totalHabits ?? prev?.totalHabits ?? localStats.totalHabits,
          completedHabitsToday: data.completedHabitsToday ?? prev?.completedHabitsToday ?? localStats.completedHabitsToday,
          totalFocusTime: data.totalFocusTime ?? prev?.totalFocusTime ?? localStats.totalFocusTime,
          totalPomos: data.totalPomos ?? prev?.totalPomos ?? localStats.totalPomos,
          unlockedAchievements: data.unlockedAchievements ?? prev?.unlockedAchievements ?? localStats.unlockedAchievements,
        }))
      } catch (error) {
        console.error('Failed to load profile summary from backend', error)
      }
    }

    void loadProfileSummary()

    return () => {
      isMounted = false
    }
  }, [localStats])

  const stats = remoteStats ?? localStats

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <AppPage>
      <AppPageContainer>
        <header className="py-6 border-b border-border shrink-0 hidden md:block">
          <h1 className="text-3xl font-bold">{t('nav.profile')}</h1>
          <p className="text-muted-foreground">Your profile and statistics</p>
        </header>
      </AppPageContainer>
      <AppPageMain className="py-4 md:py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-6">
              <Avatar user={user} className="w-20 h-20" />
              <div>
                <h2 className="text-2xl font-bold">{user?.name}</h2>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircleIcon className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">{t('profile.tasksCompleted')}</h3>
              </div>
              <p className="text-3xl font-bold">{stats.completedTasks}/{stats.totalTasks}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.completionRate}% {t('profile.completionRate')}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <CalendarIcon className="h-6 w-6 text-green-500" />
                <h3 className="font-semibold">{t('dashboard.stat.habits')}</h3>
              </div>
              <p className="text-3xl font-bold">{stats.completedHabitsToday}/{stats.totalHabits}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('profile.completedToday')}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <ClockIcon className="h-6 w-6 text-blue-500" />
                <h3 className="font-semibold">{t('pomodoro.focusTime')}</h3>
              </div>
              <p className="text-3xl font-bold">{formatDuration(stats.totalFocusTime)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.totalPomos} {t('profile.sessions')}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrophyIcon className="h-6 w-6 text-yellow-500" />
                <h3 className="font-semibold">{t('profile.achievements')}</h3>
              </div>
              <p className="text-3xl font-bold">{stats.unlockedAchievements}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('profile.unlocked')}
              </p>
            </div>
          </div>
        </div>
      </AppPageMain>
    </AppPage>
  )
}

export default ProfileView

