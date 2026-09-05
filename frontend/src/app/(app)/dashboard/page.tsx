'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import { useI18n } from '@/lib/i18n/hooks'
import type { TranslationKey } from '@/lib/i18n/types'
import { CalendarDayIcon, CalendarIcon, CheckCircleIcon, FlagIcon, RepeatIcon, SparklesIcon } from '@/lib/icons'
import ProductivityHeatmap from '@/components/dashboard/ProductivityHeatmap'
import { useRouter } from 'next/navigation'
import { useModal } from '@/components/providers/modal-provider'
import { useSettings } from '@/components/providers/settings-provider'
import { AppPage, AppPageMain } from '@/components/layout/app-page'
import { AppPageHeader } from '@/components/layout/app-page-header'
import { Button } from '@/components/ui/button'
import { AI_FEATURES_ENABLED } from '@/lib/feature-flags'
import { PRIORITY_MAP } from '@/lib/task-constants'
import type { Task } from '@/types'
import * as profileApi from '@/lib/api/profile'

const useCountUp = (end: number, duration = 650) => {
  const [count, setCount] = useState(end)
  const previousValueRef = useRef(end)

  useEffect(() => {
    const startValue = previousValueRef.current
    previousValueRef.current = end
    let frame = 0

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      frame = requestAnimationFrame(() => setCount(end))
      return () => cancelAnimationFrame(frame)
    }

    let startTimestamp: number | null = null

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
      .slice(0, 4)
  }, [state.tasks])

  const desktopFocusTasks = useMemo(() => {
    const priorityOrder = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
      none: 4,
    } as const

    return state.tasks
      .filter((task) => !task.completed && (task.priority === 'urgent' || task.priority === 'high'))
      .sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff

        const aDueTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
        const bDueTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
        return aDueTime - bDueTime
      })
      .slice(0, 4)
  }, [state.tasks])

  const recentlyCompletedTasks = useMemo(() => {
    return state.tasks
      .filter((task) => task.completed && task.completedAt)
      .sort(
        (a, b) =>
          new Date(b.completedAt as string).getTime() - new Date(a.completedAt as string).getTime(),
      )
      .slice(0, 4)
  }, [state.tasks])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('dashboard.greeting.morning')
    if (hour < 18) return t('dashboard.greeting.afternoon')
    return t('dashboard.greeting.evening')
  }

  const getTaskCountLabel = (count: number) =>
    count === 1
      ? t('taskList.summary.tasks', { count })
      : t('taskList.summary.tasks_plural', { count })

  const openList = (listId?: string) => {
    if (listId) dispatch({ type: 'SET_ACTIVE_LIST', payload: listId })
    router.push('/list')
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
                  openList('today')
                }}
                className="group flex min-h-32 cursor-pointer items-start gap-4 rounded-xl border border-border/70 bg-card p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-150 hover:bg-muted/20 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5"
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
                  openList('upcoming')
                }}
                className="group flex min-h-32 cursor-pointer items-start gap-4 rounded-xl border border-border/70 bg-card p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-150 hover:bg-muted/20 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5"
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
                className="group flex min-h-32 cursor-pointer items-start gap-4 rounded-xl border border-border/70 bg-card p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-150 hover:bg-muted/20 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5"
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

            <DashboardTaskPanel
              className="hidden lg:block"
              icon={<CheckCircleIcon className="h-4 w-4" />}
              title={t('dashboard.recentCompletions.title' as TranslationKey)}
              subtitle={t('dashboard.recentCompletions.subtitle' as TranslationKey)}
              tasks={recentlyCompletedTasks}
              countLabel={getTaskCountLabel(recentlyCompletedTasks.length)}
              emptyMessage={t('dashboard.recentCompletions.empty' as TranslationKey)}
              fallbackTitle={t('dashboard.todayPlan.untitled' as TranslationKey)}
              onTaskClick={(task) => openTask(task.id, task.listId)}
              renderMeta={(task) => {
                const completedAtLabel = new Date(task.completedAt as string).toLocaleString(
                  settings.language || undefined,
                  {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )

                return (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {completedAtLabel}
                  </p>
                )
              }}
            />
          </div>

          <aside className="space-y-4 lg:space-y-6">
            <DashboardTaskPanel
              className="hidden lg:block"
              icon={<FlagIcon className="h-4 w-4" />}
              title={t('dashboard.desktopFocus.title' as TranslationKey)}
              subtitle={t('dashboard.desktopFocus.subtitle' as TranslationKey)}
              tasks={desktopFocusTasks}
              countLabel={getTaskCountLabel(desktopFocusTasks.length)}
              emptyMessage={t('dashboard.desktopFocus.empty' as TranslationKey)}
              fallbackTitle={t('dashboard.todayPlan.untitled' as TranslationKey)}
              emptyAction={
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => openList()}>
                  {t('dashboard.desktopFocus.openList' as TranslationKey)}
                </Button>
              }
              onTaskClick={(task) => openTask(task.id, task.listId)}
              taskAlignmentClassName="items-start"
              renderMeta={(task) => {
                const priorityMeta = PRIORITY_MAP[task.priority] || PRIORITY_MAP.none
                const dueLabel = task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString(settings.language || undefined, {
                      day: '2-digit',
                      month: '2-digit',
                    })
                  : t('dashboard.desktopFocus.noDueDate' as TranslationKey)

                return (
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: priorityMeta.checkboxBorderValue }}
                      aria-hidden
                    />
                    <span>{t(priorityMeta.label as TranslationKey)}</span>
                    <span aria-hidden>·</span>
                    <span>{dueLabel}</span>
                  </div>
                )
              }}
            />

            <DashboardTaskPanel
              icon={<CalendarDayIcon className="h-4 w-4" />}
              title={t('dashboard.todayPlan.title' as TranslationKey)}
              subtitle={t('dashboard.todayPlan.subtitle' as TranslationKey)}
              tasks={todayPlanTasks}
              countLabel={getTaskCountLabel(todayPlanTasks.length)}
              emptyMessage={t('dashboard.todayPlan.empty' as TranslationKey)}
              fallbackTitle={t('dashboard.todayPlan.untitled' as TranslationKey)}
              emptyAction={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => openList('today')}
                >
                  {t('taskList.summary.today')}
                </Button>
              }
              onTaskClick={(task) => openTask(task.id, task.listId)}
              renderMeta={(task) => {
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
                  <p
                    className={`mt-1 text-xs ${
                      isTaskOverdue ? 'font-medium text-destructive' : 'text-muted-foreground'
                    }`}
                  >
                    {statusLabel} · {timeLabel}
                  </p>
                )
              }}
            />

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

type DashboardTaskPanelProps = {
  className?: string
  icon: React.ReactNode
  title: string
  subtitle: string
  tasks: Task[]
  countLabel?: string
  emptyMessage: string
  fallbackTitle: string
  emptyAction?: React.ReactNode
  onTaskClick: (task: Task) => void
  renderMeta: (task: Task) => React.ReactNode
  taskAlignmentClassName?: string
}

function DashboardTaskPanel({
  className,
  icon,
  title,
  subtitle,
  tasks,
  countLabel,
  emptyMessage,
  fallbackTitle,
  emptyAction,
  onTaskClick,
  renderMeta,
  taskAlignmentClassName = 'items-center',
}: DashboardTaskPanelProps) {
  return (
    <section className={`${className ? `${className} ` : ''}overflow-hidden rounded-xl border border-border/70 bg-card`}>
      <div className="border-b border-border/60 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{title}</h2>
              {countLabel ? (
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {countLabel}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <CheckCircleIconFallback />
          <p className="mt-3 text-sm font-medium text-foreground">{emptyMessage}</p>
          {emptyAction}
        </div>
      ) : (
        <ul className="max-h-[200px] overflow-y-auto divide-y divide-border/50">
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => onTaskClick(task)}
                className={`group cursor-pointer flex w-full ${taskAlignmentClassName} justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none sm:px-5`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.title || fallbackTitle}</p>
                  {renderMeta(task)}
                </div>
                <span
                  className="text-sm text-muted-foreground transition-transform motion-reduce:transition-none group-hover:translate-x-0.5"
                  aria-hidden
                >
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CheckCircleIconFallback() {
  return (
    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary" aria-hidden>
      <span className="h-2.5 w-2.5 rounded-full bg-current" />
    </span>
  )
}