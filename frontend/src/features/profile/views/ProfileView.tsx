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
import { Input } from '@/components/ui/input'
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
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const habitProgress =
    stats.totalHabits > 0
      ? Math.round((stats.completedHabitsToday / stats.totalHabits) * 100)
      : 0

  const overviewItems = [
    {
      key: 'tasks',
      icon: <CheckCircleIcon className="h-5 w-5" />,
      label: t('profile.tasksCompleted'),
      value: `${stats.completedTasks}/${stats.totalTasks}`,
      detail: `${stats.completionRate}% ${t('profile.completionRate')}`,
      progress: stats.completionRate,
      className: 'text-primary',
    },
    {
      key: 'habits',
      icon: <CalendarIcon className="h-5 w-5" />,
      label: t('dashboard.stat.habits'),
      value: `${stats.completedHabitsToday}/${stats.totalHabits}`,
      detail: t('profile.completedToday'),
      progress: habitProgress,
      className: 'text-[hsl(var(--color-habits-summary-completed))]',
    },
    {
      key: 'focus',
      icon: <ClockIcon className="h-5 w-5" />,
      label: t('pomodoro.focusTime'),
      value: formatDuration(stats.totalFocusTime),
      detail: `${stats.totalPomos} ${t('profile.sessions')}`,
      progress: null,
      className: 'text-[hsl(var(--color-pomodoro-focus))]',
    },
    {
      key: 'achievements',
      icon: <TrophyIcon className="h-5 w-5" />,
      label: t('profile.achievements'),
      value: String(stats.unlockedAchievements),
      detail: t('profile.unlocked'),
      progress: null,
      className: 'text-[hsl(var(--color-habits-summary-streak))]',
    },
  ]

  return (
    <AppPage>
      <AppPageHeader
        title={t('nav.profile')}
        subtitle={t('profile.subtitle')}
        hideOnMobile={false}
      />
      <AppPageMain className="py-4 md:py-6">
        <div className="mx-auto max-w-4xl space-y-5 md:space-y-6">
          <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar user={user} className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <form onSubmit={handleSaveName} className="max-w-md space-y-3">
                    <label htmlFor="profile-display-name" className="block text-sm font-medium">
                      {t('profile.name')}
                    </label>
                    <Input
                      id="profile-display-name"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      autoFocus
                      required
                      minLength={1}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={isSaving || !editName.trim()}>
                        {t('profile.save')}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                        {t('profile.cancel')}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="truncate text-2xl font-bold tracking-tight">{user?.name}</h2>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleStartEdit}>
                      {t('profile.edit')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {overviewItems.map((item) => (
              <div
                key={item.key}
                className="rounded-xl border border-border/70 bg-card p-4 transition-[border-color,box-shadow] duration-150 hover:border-border hover:shadow-sm motion-reduce:transition-none sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{item.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 ${item.className}`}>
                    {item.icon}
                  </span>
                </div>
                {item.progress !== null && (
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full bg-current transition-[width] duration-300 motion-reduce:transition-none ${item.className}`}
                      style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </section>
        </div>
      </AppPageMain>
    </AppPage>
  )
}

export default ProfileView
