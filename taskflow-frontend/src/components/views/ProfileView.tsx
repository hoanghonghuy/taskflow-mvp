'use client'

import React, { useMemo } from 'react'
import { useUser } from '@/components/providers/user-provider'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { Avatar } from '@/components/ui/avatar'
import { CalendarIcon, CheckCircleIcon, ClockIcon, TrophyIcon } from 'lucide-react'
import { toYYYYMMDD } from '@/lib/utils/date-helpers'

const ProfileView: React.FC = () => {
  const { user } = useUser()
  const { state } = useTaskManager()
  const { t } = useI18n()

  const stats = useMemo(() => {
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

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <header className="p-6 border-b border-border flex-shrink-0">
        <h1 className="text-3xl font-bold">{t('nav.profile')}</h1>
        <p className="text-muted-foreground">Your profile and statistics</p>
      </header>
      <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
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
                <h3 className="font-semibold">{t('profile.tasks') || 'Tasks'}</h3>
              </div>
              <p className="text-3xl font-bold">{stats.completedTasks}/{stats.totalTasks}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.completionRate}% completion rate
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <CalendarIcon className="h-6 w-6 text-green-500" />
                <h3 className="font-semibold">{t('profile.habits') || 'Habits'}</h3>
              </div>
              <p className="text-3xl font-bold">{stats.completedHabitsToday}/{stats.totalHabits}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Completed today
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <ClockIcon className="h-6 w-6 text-blue-500" />
                <h3 className="font-semibold">{t('profile.focusTime') || 'Focus Time'}</h3>
              </div>
              <p className="text-3xl font-bold">{formatDuration(stats.totalFocusTime)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.totalPomos} sessions
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrophyIcon className="h-6 w-6 text-yellow-500" />
                <h3 className="font-semibold">{t('profile.achievements') || 'Achievements'}</h3>
              </div>
              <p className="text-3xl font-bold">{stats.unlockedAchievements}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Unlocked
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProfileView

