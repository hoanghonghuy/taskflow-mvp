"use client"

import React, { useState, useMemo } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useHabitActions } from '@/components/providers/task-manager-provider'
import { useConfirmation } from '@/lib/hooks/use-confirmation'
import type { TranslationKey } from '@/lib/i18n/types'
import { PlusIcon, TrashIcon } from '@/lib/icons'
import { toYYYYMMDD } from '@/lib/utils/date-helpers'
import { AppPage, AppPageContainer, AppPageMain } from '@/components/layout/app-page'

const calculateStreak = (completions: string[]): number => {
  if (completions.length === 0) return 0

  const sortedDates = completions
    .map(date => new Date(date))
    .sort((a, b) => b.getTime() - a.getTime())

  let streak = 0
  const today = new Date()
  const todayStr = toYYYYMMDD(today)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toYYYYMMDD(yesterday)

  const latestStr = toYYYYMMDD(sortedDates[0])
  if (latestStr !== todayStr && latestStr !== yesterdayStr) return 0

  streak = 1
  let currentDate = sortedDates[0]

  for (let i = 1; i < sortedDates.length; i++) {
    const expected = new Date(currentDate)
    expected.setDate(expected.getDate() - 1)

    if (toYYYYMMDD(sortedDates[i]) === toYYYYMMDD(expected)) {
      streak++
      currentDate = sortedDates[i]
    } else {
      break
    }
  }

  return streak
}

const HabitsView: React.FC = () => {
  const { state } = useTaskManager()
  const { addHabit, deleteHabit, toggleHabitCompletion } = useHabitActions()
  const { t } = useI18n()
  const { confirm } = useConfirmation()
  const [newHabitName, setNewHabitName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const today = toYYYYMMDD(new Date())
  const last30Days = useMemo(() => {
    const days: string[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(toYYYYMMDD(date))
    }
    return days
  }, [])

  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      addHabit({ name: newHabitName.trim() })
      setNewHabitName('')
      setIsAdding(false)
    }
  }

  const handleToggleCompletion = (habitId: string, date: string) => {
    toggleHabitCompletion(habitId, date)
  }

  const handleDeleteHabit = async (habitId: string, habitName: string) => {
    const isConfirmed = await confirm({
      title: t('habits.deleteConfirm.title' as TranslationKey, { name: habitName }),
      description: t('habits.deleteConfirm.description' as TranslationKey, { name: habitName }),
      confirmText: t('habits.deleteConfirm.confirm' as TranslationKey),
      cancelText: t('common.cancel' as TranslationKey),
      variant: 'destructive',
    })

    if (!isConfirmed) return
    deleteHabit(habitId)
  }

  const getCompletionRate = (habitId: string) => {
    const habit = state.habits.find(h => h.id === habitId)
    if (!habit) return 0
    const completedInLast30 = last30Days.filter(date => habit.completions.includes(date)).length
    return Math.round((completedInLast30 / 30) * 100)
  }

  const longestStreak = useMemo(() => {
    return state.habits.reduce((max, habit) => {
      const streak = calculateStreak(habit.completions)
      return Math.max(max, streak)
    }, 0)
  }, [state.habits])

  const completedTodayCount = useMemo(() => {
    return state.habits.filter(habit => habit.completions.includes(today)).length
  }, [state.habits, today])

  const summaryCards = [
    {
      label: t('habits.summary.total'),
      value: state.habits.length,
      accent: 'from-purple-500/20 to-purple-500/5 text-purple-500',
    },
    {
      label: t('habits.summary.completedToday'),
      value: completedTodayCount,
      accent: 'from-emerald-500/20 to-emerald-500/5 text-emerald-500',
    },
    {
      label: t('habits.summary.longestStreak'),
      value: `${longestStreak} ${t('habits.summary.days')}`,
      accent: 'from-amber-500/20 to-amber-500/5 text-amber-500',
    },
  ]

  return (
    <AppPage>
      <AppPageContainer>
        <header className="py-6 border-b border-border shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="hidden md:block">
              <h1 className="text-3xl font-bold">{t('nav.habits')}</h1>
              <p className="text-muted-foreground">{t('habits.subtitle')}</p>
            </div>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                <span>{t('habits.add')}</span>
              </button>
            )}
          </div>
          {isAdding && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddHabit()
                  } else if (e.key === 'Escape') {
                    setIsAdding(false)
                    setNewHabitName('')
                  }
                }}
                placeholder={t('habits.namePlaceholder')}
                className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <button
                onClick={handleAddHabit}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {t('habits.add')}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false)
                  setNewHabitName('')
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-muted transition-colors"
              >
                {t('habits.cancel')}
              </button>
            </div>
          )}
        </header>
      </AppPageContainer>
      <AppPageMain className="py-4 md:py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryCards.map(card => (
            <div
              key={card.label}
              className={`rounded-2xl border border-border bg-linear-to-br ${card.accent} p-4 backdrop-blur-sm`}
            >
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-semibold">{card.value}</p>
            </div>
          ))}
        </div>
        {state.habits.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg">{t('habits.noHabits')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {state.habits.map(habit => {
              const completionRate = getCompletionRate(habit.id)
              const isCompletedToday = habit.completions.includes(today)

              return (
                <div key={habit.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{habit.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('habits.completionRate', { rate: completionRate, days: 30 })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleCompletion(habit.id, today)}
                        className={`
                          px-4 py-2 rounded-lg font-medium transition-all border
                          ${isCompletedToday
                            ? 'bg-primary text-primary-foreground border-primary shadow'
                            : 'bg-card text-muted-foreground border-border hover:border-primary/50'}
                        `}
                      >
                        {isCompletedToday ? t('habits.completed') : t('habits.markComplete')}
                      </button>
                      <button
                        onClick={() => handleDeleteHabit(habit.id, habit.name)}
                        className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label={t('habits.aria.deleteHabit')}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-2">{t('habits.weeklyOverview')}</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 7 }).map((_, idx) => {
                          const date = new Date()
                          date.setDate(date.getDate() - (6 - idx))
                          const dateKey = toYYYYMMDD(date)
                          const isCompleted = habit.completions.includes(dateKey)
                          return (
                            <button
                              key={dateKey}
                              onClick={() => toggleHabitCompletion(habit.id, dateKey)}
                              className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center text-xs font-semibold transition
                                ${isCompleted
                                  ? 'border-emerald-500 bg-emerald-500/90 text-white shadow-sm'
                                  : 'border-border bg-card text-muted-foreground hover:border-emerald-400 hover:text-foreground'}
                              `}
                            >
                              <span>{date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}</span>
                              <span>{date.getDate()}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-2">{t('habits.last30Days')}</p>
                      <div className="grid grid-cols-30 gap-1.5">
                        {last30Days.map(date => {
                          const isCompleted = habit.completions.includes(date)
                          const isTodayDate = date === today
                          return (
                            <div
                              key={date}
                              className={`
                                aspect-square rounded-md border transition-all cursor-pointer
                                ${isCompleted ? 'bg-emerald-500 border-emerald-500 hover:bg-emerald-400' : 'bg-muted border-border hover:border-emerald-300'}
                                ${isTodayDate ? 'ring-2 ring-primary ring-offset-1' : ''}
                              `}
                              onClick={() => handleToggleCompletion(habit.id, date)}
                              title={new Date(date).toLocaleDateString()}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </AppPageMain>
    </AppPage>
  )
}

export default HabitsView

