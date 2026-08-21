'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import { useI18n } from '@/lib/i18n/hooks'
import type { TranslationKey } from '@/lib/i18n/types'
import { CalendarDayIcon, CalendarIcon, RepeatIcon, SparklesIcon } from '@/lib/icons'
import ProductivityHeatmap from '@/components/dashboard/ProductivityHeatmap'
import { useRouter } from 'next/navigation'
import { useModal } from '@/components/providers/modal-provider'
import { useSettings } from '@/components/providers/settings-provider'
import { AppPage, AppPageMain } from '@/components/layout/app-page'
import { AppPageHeader } from '@/components/layout/app-page-header'
import { Button } from '@/components/ui/button'
import { AI_FEATURES_ENABLED } from '@/lib/feature-flags'
import * as profileApi from '@/lib/api/profile'

const useCountUp = (end: number, duration = 650) => {
  const [count, setCount] = useState(end)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setCount(end)
      return
    }

    let frame = 0
    let startTimestamp: number | null = null
    const startValue = count

    const step = (timestamp: number) => {
      if (startTimestamp === null) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      setCount(Math.round(startValue + (end - startValue) * progress))
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [duration, end])

  return count
}

const isToday = (date: Date): boolean => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

const isFuture = (date: Date): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const otherDate = new Date(date)
  otherDate.setHours(0, 0, 0, 0)
  return otherDate.getTime() > today.getTime()
}

const isOverdue = (date: Date): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate.getTime() < today.getTime()
}

const toYYYYMMDD = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

type DashboardStats = {
  today: number
  upcoming: number
  habitsCompleted: number
  habitsTotal: number
}

type ProfileSummaryResponse = {
  totalTasks: number
  completedTasks: number
  completionRate: number
  totalHabits: number
  completedHabitsToday: number
  totalFocusTime: number
  totalPomos: number
  unlockedAchievements: number
  todayTasksPending?: number
  upcomingTasksPending?: number
}

export default function DashboardPage() {
  const { state, dispatch } = useTaskManager()
  const { t } = useI18n()
  const router = useRouter()
  const { openBriefing } = useModal()
  const { settings } = useSettings()

  const localStats = useMemo<DashboardStats>(() => {
    const uncompletedTasks = state.tasks.filter((task) => !task.completed)
    const todayTasks = uncompletedTasks.filter((task) => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return isToday(taskDate) || isOverdue(taskDate)
    }).length

    const upcomingTasks = uncompletedTasks.filter(
      (task) => task.dueDate && isFuture(new Date(task.dueDate)),
    ).length

    const todayStr = toYYYYMMDD(new Date())
    const habitsToday = state.habits.filter((habit) => habit.completions.includes(todayStr)).length

    return {
      today: todayTasks,
      upcoming: upcomingTasks,
      habitsCompleted: habitsToday,
      habitsTotal: state.habits.length,
    }
  }, [state.tasks, state.habits])

  const [remoteStats, setRemoteStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadSummary = async () => {
      try {
        const data = (await profileApi.fetchProfileSummary()) as Partial<ProfileSummaryResponse> | null
        if (!data || !isMounted) return

        setRemoteStats((previous) => ({
          today: data.todayTasksPending ?? previous?.today ?? localStats.today,
          upcoming: data.upcomingTasksPending ?? previous?.upcoming ?? localStats.upcoming,
          habitsCompleted:
            data.completedHabitsToday ?? previous?.habitsCompleted ?? localStats.habitsCompleted,
          habitsTotal: data.totalHabits ?? previous?.habitsTotal ?? localStats.habitsTotal,
        }))
      } catch (error) {
        console.error('Failed to load dashboard summary from backend', error)
      }
    }

    void loadSummary()
    return () => {
      isMounted = false
    }
  }, [localStats])

  const stats = remoteStats ?? localStats
  const animatedToday = useCountUp(stats.today)
  const animatedUpcoming = useCountUp(stats.upcoming)
  const animatedHabits = useCountUp(stats.habitsCompleted)
  const habitsCompletionPercent =
    stats.habitsTotal > 0
      ? Math.round((stats.habitsCompleted / stats.habitsTotal) * 100)
      : 0

  const todayPlanTasks = useMemo(() => {
    return state.tasks
      .filter((task) => !task.completed && task.dueDate)
      .filter((task) => {
        const due = new Date(task.dueDate as string)
        return isToday(due) || isOverdue(due)
      })
      .sort(
        (a, b) =>
          new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime(),
      )
      .slice(0, 5)
  }, [state.tasks])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('dashboard.greeting.morning')
    if (hour < 18) return t('dashboard.greeting.afternoon')
    return t('dashboard.greeting.evening')
  }

  const openTask = (taskId: string, listId?: string) => {
    if (listId) dispatch({ type: 'SET_ACTIVE_LIST', payload: listId })
    dispatch({ type: 'SET_SELECTED_TASK', payload: taskId })
    router.push('/list')
  }

  return (
    <AppPage>
      <AppPageHeader
        title={getGreeting()}
        subtitle={t('dashboard.subtitle')}
        hideOnMobile={false}
      />

      <AppPageMain className="py-4 md:py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:gap-8">
          <div className="space-y-6">
            <section className="grid gap-3 sm:grid-cols-3 sm:gap-4" aria-label={t('dashboard.subtitle')}>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_LIST', payload: 'today' })
                  router.push('/list')
                }}
                className="group flex min-h-32 items-start gap-4 rounded-xl border border-border/70 bg-card p-4 text-left transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none sm:p-5"
              >
                <div className="rounded-xl bg-[hsl(var(--color-dashboard-today)/0.1)] p-3 text-[hsl(var(--color-dashboard-today))]">
                  <CalendarDayIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t('dashboard.stat.today')}
                  </p>
                  <p className="mt-1 text-3xl font-bold tabular-nums">{animatedToday}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('taskList.summary.today')}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_LIST', payload: 'upcoming' })
                  router.push('/list')
                }}
                className="group flex min-h-32 items-start gap-4 rounded-xl border border-border/70 bg-card p-4 text-left transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none sm:p-5"
              >
                <div className="rounded-xl bg-[hsl(var(--color-dashboard-upcoming)/0.1)] p-3 text-[hsl(var(--color-dashboard-upcoming))]">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t('dashboard.stat.upcoming')}
                  </p>
                  <p className="mt-1 text-3xl font-bold tabular-nums">{animatedUpcoming}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('taskList.summary.upcoming')}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'SET_VIEW', payload: 'habit' })
                  router.push('/habits')
                }}
                className="group flex min-h-32 items-start gap-4 rounded-xl border border-border/70 bg-card p-4 text-left transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none sm:p-5"
              >
                <div className="rounded-xl bg-[hsl(var(--color-dashboard-habits)/0.1)] p-3 text-[hsl(var(--color-dashboard-habits))]">
                  <RepeatIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t('dashboard.stat.habits')}
                  </p>
                  <p className="mt-1 text-3xl font-bold tabular-nums">
                    {animatedHabits}/{stats.habitsTotal}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[hsl(var(--color-dashboard-habits))] transition-[width] duration-300 motion-reduce:transition-none"
                      style={{ width: `${habitsCompletionPercent}%` }}
                    />
                  </div>
                </div>
              </button>
            </section>

            <section className="rounded-xl border border-border/70 bg-card p-4 shadow-sm md:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <CalendarDayIcon className="h-4 w-4" />
                </div>
                <h2 className="text-base font-semibold md:text-lg">{t('dashboard.heatmapTitle')}</h2>
              </div>
              <ProductivityHeatmap />
            </section>
          </div>

          <aside className="space-y-4 lg:space-y-6">
            <section className="overflow-hidden rounded-xl border border-border/70 bg-card">
              <div className="border-b border-border/60 px-4 py-4 sm:px-5">
                <h2 className="text-lg font-semibold">
                  {t('dashboard.todayPlan.title' as TranslationKey)}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('dashboard.todayPlan.subtitle' as TranslationKey)}
                </p>
              </div>

              {todayPlanTasks.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <CheckCircleIconFallback />
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {t('dashboard.todayPlan.empty' as TranslationKey)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      dispatch({ type: 'SET_ACTIVE_LIST', payload: 'today' })
                      router.push('/list')
                    }}
                  >
                    {t('taskList.summary.today')}
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {todayPlanTasks.map((task) => {
                    const due = new Date(task.dueDate as string)
                    const isTaskOverdue = isOverdue(due)
                    const timeLabel = due.toLocaleTimeString(settings.language || undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    const statusLabel = isTaskOverdue
                      ? t('dashboard.todayPlan.status.overdue' as TranslationKey)
                      : t('dashboard.todayPlan.status.today' as TranslationKey)

                    return (
                      <li key={task.id}>
                        <button
                          type="button"
                          onClick={() => openTask(task.id, task.listId)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none sm:px-5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {task.title || t('dashboard.todayPlan.untitled' as TranslationKey)}
                            </p>
                            <p
                              className={`mt-1 text-xs ${
                                isTaskOverdue ? 'font-medium text-destructive' : 'text-muted-foreground'
                              }`}
                            >
                              {statusLabel} · {timeLabel}
                            </p>
                          </div>
                          <span className="text-sm text-muted-foreground" aria-hidden>→</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            {AI_FEATURES_ENABLED && (
              <section className="rounded-xl border border-border/70 bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
                    <SparklesIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold">{t('mainContent.dailyBriefing')}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.cta.subtitle')}</p>
                    <Button type="button" size="sm" onClick={openBriefing} className="mt-3 gap-2">
                      <SparklesIcon className="h-4 w-4" />
                      {t('dashboard.cta.button')}
                    </Button>
                  </div>
                </div>
              </section>
            )}
          </aside>
        </div>
      </AppPageMain>
    </AppPage>
  )
}

function CheckCircleIconFallback() {
  return (
    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary" aria-hidden>
      <span className="h-2.5 w-2.5 rounded-full bg-current" />
    </span>
  )
}
