'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import { useI18n } from '@/lib/hooks/use-i18n'
import type { TranslationKey } from '@/lib/i18n/types'
import { CalendarDayIcon, CalendarIcon, RepeatIcon, SparklesIcon } from '@/lib/icons'
import ProductivityHeatmap from '@/components/dashboard/ProductivityHeatmap'
import { useRouter } from 'next/navigation'
import { useModal } from '@/components/providers/modal-provider'
import { AppPage, AppPageContainer, AppPageMain } from '@/components/layout/app-page'

const useCountUp = (end: number, duration = 1200) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const current = Math.floor(progress * end)
      setCount(current)
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  }, [end, duration])

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

const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0]

export default function DashboardPage() {
  const { state, dispatch } = useTaskManager()
  const { t } = useI18n()
  const router = useRouter()
  const { openBriefing } = useModal()

  const stats = useMemo(() => {
    const uncompletedTasks = state.tasks.filter(t => !t.completed)
    const todayTasks = uncompletedTasks.filter(t => {
      if (!t.dueDate) return false
      const taskDate = new Date(t.dueDate)
      return isToday(taskDate) || isOverdue(taskDate)
    }).length

    const upcomingTasks = uncompletedTasks.filter(t => t.dueDate && isFuture(new Date(t.dueDate))).length
    
    const todayStr = toYYYYMMDD(new Date())
    const habitsToday = state.habits.filter(h => h.completions.includes(todayStr)).length

    return {
      today: todayTasks,
      upcoming: upcomingTasks,
      habitsCompleted: habitsToday,
      habitsTotal: state.habits.length
    }
  }, [state.tasks, state.habits])
  
  const animatedToday = useCountUp(stats.today)
  const animatedUpcoming = useCountUp(stats.upcoming)
  const animatedHabits = useCountUp(stats.habitsCompleted)

  const habitsCompletionPercent = stats.habitsTotal > 0
    ? Math.round((stats.habitsCompleted / stats.habitsTotal) * 100)
    : 0

  const todayPlanTasks = useMemo(() => {
    const uncompleted = state.tasks.filter(t => !t.completed)
    const withDue = uncompleted.filter(t => t.dueDate)

    const dueTodayOrOverdue = withDue.filter(t => {
      const due = new Date(t.dueDate as string)
      return isToday(due) || isOverdue(due)
    })

    return [...dueTodayOrOverdue]
      .sort((a, b) => {
        const da = new Date(a.dueDate as string).getTime()
        const db = new Date(b.dueDate as string).getTime()
        return da - db
      })
      .slice(0, 5)
  }, [state.tasks])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('dashboard.greeting.morning')
    if (hour < 18) return t('dashboard.greeting.afternoon')
    return t('dashboard.greeting.evening')
  }

  return (
    <AppPage>
      <AppPageContainer>
        <header className="py-6 border-b border-border shrink-0 hidden md:block">
          <h1 className="text-3xl font-bold">{getGreeting()}</h1>
          <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
        </header>
      </AppPageContainer>
      <AppPageMain className="py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 lg:gap-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <button 
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_LIST', payload: 'today' })
                  router.push('/list')
                }}
                className="bg-card border border-border rounded-lg p-5 flex items-start gap-4 text-left hover:shadow-md hover:border-primary/50 transition-all"
              >
                <div className="bg-blue-500/10 text-blue-500 p-3 rounded-lg">
                  <CalendarDayIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-1">{t('dashboard.stat.today')}</p>
                  <p className="text-3xl font-bold leading-tight">{animatedToday}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('taskList.summary.today')}</p>
                </div>
              </button>
              <button 
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_LIST', payload: 'upcoming' })
                  router.push('/list')
                }}
                className="bg-card border border-border rounded-lg p-5 flex items-start gap-4 text-left hover:shadow-md hover:border-primary/50 transition-all"
              >
                <div className="bg-purple-500/10 text-purple-500 p-3 rounded-lg">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-1">{t('dashboard.stat.upcoming')}</p>
                  <p className="text-3xl font-bold leading-tight">{animatedUpcoming}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('taskList.summary.upcoming')}</p>
                </div>
              </button>
              <button 
                onClick={() => {
                  dispatch({ type: 'SET_VIEW', payload: 'habit' })
                  router.push('/habits')
                }}
                className="bg-card border border-border rounded-lg p-5 flex items-start gap-4 text-left hover:shadow-md hover:border-primary/50 transition-all"
              >
                <div className="bg-green-500/10 text-green-500 p-3 rounded-lg">
                  <RepeatIcon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-1">{t('dashboard.stat.habits')}</p>
                  <p className="text-3xl font-bold leading-tight">{animatedHabits}/{stats.habitsTotal}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${habitsCompletionPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t('habits.completed')}</p>
                </div>
              </button>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <CalendarDayIcon className="h-4 w-4" />
                  </div>
                  <h2 className="text-base md:text-lg font-semibold">
                    {t('dashboard.heatmapTitle')}
                  </h2>
                </div>
              </div>
              <ProductivityHeatmap />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold">Today plan</h2>
                <p className="text-sm text-muted-foreground">
                  Top tasks that are due today or overdue.
                </p>
              </div>

              {todayPlanTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You are all caught up for today.
                </p>
              ) : (
                <ul className="space-y-2">
                  {todayPlanTasks.map(task => {
                    const due = task.dueDate ? new Date(task.dueDate as string) : null
                    const isTaskOverdue = due ? isOverdue(due) : false
                    const isTaskToday = due ? isToday(due) : false
                    const timeLabel = due
                      ? due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : null
                    const statusLabel = isTaskOverdue
                      ? t('dashboard.todayPlan.status.overdue' as TranslationKey)
                      : isTaskToday
                        ? t('dashboard.todayPlan.status.today' as TranslationKey)
                        : ''

                    return (
                      <li key={task.id}>
                        <button
                          onClick={() => {
                            if (task.listId) {
                              dispatch({ type: 'SET_ACTIVE_LIST', payload: task.listId })
                            }
                            dispatch({ type: 'SET_SELECTED_TASK', payload: task.id })
                            router.push('/list')
                          }}
                          className="w-full flex items-start justify-between gap-3 rounded-md border border-transparent px-3 py-2 text-left hover:border-primary/40 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{task.title || 'Untitled task'}</p>
                            {(statusLabel || timeLabel) && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {statusLabel}
                                {timeLabel ? ` · ${timeLabel}` : ''}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary p-3 rounded-full shrink-0">
                  <SparklesIcon className="h-6 w-6" />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-sm font-semibold">{t('mainContent.dailyBriefing')}</h2>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.cta.subtitle')}
                  </p>
                </div>
              </div>
              <button
                onClick={openBriefing}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-full text-xs font-semibold hover:bg-primary/90 transition-transform hover:scale-105 self-start"
              >
                <SparklesIcon className="h-4 w-4" />
                {t('dashboard.cta.button')}
              </button>
            </div>
          </div>
        </div>
      </AppPageMain>
    </AppPage>
  )
}
