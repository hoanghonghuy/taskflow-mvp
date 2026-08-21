'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useUser } from '@/components/providers/user-provider'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { Avatar } from '@/components/ui/avatar'
import { CalendarIcon, CheckCircleIcon, ClockIcon, TrophyIcon } from 'lucide-react'
import { toYYYYMMDD } from '@/lib/utils/date-helpers'
import { AppPage, AppPageMain } from '@/components/layout/app-page'
import { AppPageHeader } from '@/components/layout/app-page-header'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { useToast } from '@/lib/hooks/use-toast'
import * as profileApi from '@/lib/api/profile'

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
  const { user, updateProfile } = useUser()
  const { state } = useTaskManager()
  const { t } = useI18n()
  const { error: showError, success } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const localStats = useMemo<ProfileSummary>(() => {
    const totalTasks = state.tasks.length
    const completedTasks = state.tasks.filter((task) => task.completed).length
    const totalHabits = state.habits.length
    const today = toYYYYMMDD(new Date())
    const completedHabitsToday = state.habits.filter((habit) => habit.completions.includes(today)).length
    const totalFocusTime = state.pomodoro.focusHistory.reduce(
      (total, session) => total + session.duration,
      0,
    )

    return {
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalHabits,
      completedHabitsToday,
      totalFocusTime,
      totalPomos: state.pomodoro.focusHistory.length,
      unlockedAchievements: state.unlockedAchievements?.length || 0,
    }
  }, [state.tasks, state.habits, state.pomodoro.focusHistory, state.unlockedAchievements])

  const [remoteStats, setRemoteStats] = useState<Partial<ProfileSummary> | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadProfileSummary = async () => {
      try {
        const data = (await profileApi.fetchProfileSummary()) as Partial<ProfileSummary> | null
        if (data && isMounted) setRemoteStats(data)
      } catch (error) {
        console.error('Failed to load profile summary from backend', error)
      }
    }

    setRemoteStats(null)
    void loadProfileSummary()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  const stats = useMemo<ProfileSummary>(
    () => ({ ...localStats, ...remoteStats }),
    [localStats, remoteStats],
  )

  const handleStartEdit = () => {
    setEditName(user?.name ?? '')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditName('')
  }

  const handleSaveName = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = editName.trim()
    if (!trimmed || trimmed === user?.name) {
      handleCancelEdit()
      return
    }

    setIsSaving(true)
    try {
      const saved = await updateProfile({ name: trimmed })
      if (!saved) {
        showError(t('profile.updateFailedTitle'), t('profile.updateFailedBody'))
        return
      }
      success(t('profile.updateSuccessTitle'), t('profile.updateSuccessBody'))
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile name', error)
      showError(t('profile.updateFailedTitle'), t('profile.updateFailedBody'))
    } finally {
      setIsSaving(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <AppPage>
      <AppPageHeader title={t('nav.profile')} subtitle={t('profile.subtitle')} />
      <AppPageMain className="py-4 md:py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <Avatar user={user} className="h-20 w-20 shrink-0" />
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <form onSubmit={handleSaveName} className="max-w-md space-y-3">
                    <label className="block text-sm font-medium text-muted-foreground">
                      {t('profile.name')}
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      autoFocus
                      required
                      minLength={1}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isSaving || !editName.trim()}>
                        {t('profile.save')}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                        {t('profile.cancel')}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h2 className="truncate text-2xl font-bold">{user?.name}</h2>
                    <p className="truncate text-muted-foreground">{user?.email}</p>
                    <Button type="button" variant="link" onClick={handleStartEdit} className="mt-3 h-auto px-0">
                      {t('profile.edit')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={<CheckCircleIcon className="h-6 w-6 text-primary" />}
              label={t('profile.tasksCompleted')}
              value={`${stats.completedTasks}/${stats.totalTasks}`}
              description={`${stats.completionRate}% ${t('profile.completionRate')}`}
            />
            <StatCard
              icon={<CalendarIcon className="h-6 w-6 text-[hsl(var(--color-habits-summary-completed))]" />}
              label={t('dashboard.stat.habits')}
              value={`${stats.completedHabitsToday}/${stats.totalHabits}`}
              description={t('profile.completedToday')}
            />
            <StatCard
              icon={<ClockIcon className="h-6 w-6 text-[hsl(var(--color-pomodoro-focus))]" />}
              label={t('pomodoro.focusTime')}
              value={formatDuration(stats.totalFocusTime)}
              description={`${stats.totalPomos} ${t('profile.sessions')}`}
            />
            <StatCard
              icon={<TrophyIcon className="h-6 w-6 text-[hsl(var(--color-habits-summary-streak))]" />}
              label={t('profile.achievements')}
              value={stats.unlockedAchievements}
              description={t('profile.unlocked')}
            />
          </div>
        </div>
      </AppPageMain>
    </AppPage>
  )
}

export default ProfileView
