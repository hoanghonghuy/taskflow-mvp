'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import { useI18n } from '@/lib/hooks/use-i18n'
import { CalendarDayIcon, CalendarIcon, RepeatIcon, SparklesIcon } from '@/lib/constants'
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
                className="bg-card border border-border rounded-lg p-6 flex items-start gap-4 text-left hover:shadow-md hover:border-primary/50 transition-all"
              >
                <div className="bg-blue-500/10 text-blue-500 p-3 rounded-lg">
                  <CalendarDayIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('dashboard.stat.today')}</p>
                  <p className="text-3xl font-bold">{animatedToday}</p>
                </div>
              </button>
              <button 
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_LIST', payload: 'upcoming' })
                  router.push('/list')
                }}
                className="bg-card border border-border rounded-lg p-6 flex items-start gap-4 text-left hover:shadow-md hover:border-primary/50 transition-all"
              >
                <div className="bg-purple-500/10 text-purple-500 p-3 rounded-lg">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('dashboard.stat.upcoming')}</p>
                  <p className="text-3xl font-bold">{animatedUpcoming}</p>
                </div>
              </button>
              <button 
                onClick={() => {
                  dispatch({ type: 'SET_VIEW', payload: 'habit' })
                  router.push('/habits')
                }}
                className="bg-card border border-border rounded-lg p-6 flex items-start gap-4 text-left hover:shadow-md hover:border-primary/50 transition-all"
              >
                <div className="bg-green-500/10 text-green-500 p-3 rounded-lg">
                  <RepeatIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('dashboard.stat.habits')}</p>
                  <p className="text-3xl font-bold">{animatedHabits}/{stats.habitsTotal}</p>
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
            <div className="bg-card border border-border rounded-lg p-8 text-center flex flex-col items-center h-full justify-center">
              <div className="bg-primary/10 text-primary p-4 rounded-full mb-4">
                <SparklesIcon className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold mb-2">{t('dashboard.cta.title')}</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {t('dashboard.cta.subtitle')}
              </p>
              <button
                onClick={openBriefing}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full text-md font-semibold hover:bg-primary/90 transition-transform hover:scale-105"
              >
                <SparklesIcon className="h-5 w-5" />
                {t('dashboard.cta.button')}
              </button>
            </div>
          </div>
        </div>
      </AppPageMain>
    </AppPage>
  )
}
