"use client"

import React, { useMemo, useState } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useHabitActions } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { useConfirmation } from '@/lib/hooks/use-confirmation'
import { useSettings } from '@/components/providers/settings-provider'
import type { TranslationKey } from '@/lib/i18n/types'
import { CheckIcon, PlusIcon, TrashIcon } from '@/lib/icons'
import { toYYYYMMDD } from '@/lib/utils/date-helpers'
import { AppPage, AppPageMain } from '@/components/layout/app-page'
import { AppPageHeader } from '@/components/layout/app-page-header'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'

const calculateStreak = (completions: string[]): number => {
  if (completions.length === 0) return 0

  const sortedDates = completions
    .map((date) => new Date(date))
    .sort((a, b) => b.getTime() - a.getTime())

  const todayStr = toYYYYMMDD(new Date())
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toYYYYMMDD(yesterday)

  const latestStr = toYYYYMMDD(sortedDates[0])
  if (latestStr !== todayStr && latestStr !== yesterdayStr) return 0

  let streak = 1
  let currentDate = sortedDates[0]

  for (let index = 1; index < sortedDates.length; index++) {
    const expected = new Date(currentDate)
    expected.setDate(expected.getDate() - 1)
    if (toYYYYMMDD(sortedDates[index]) !== toYYYYMMDD(expected)) break
    streak += 1
    currentDate = sortedDates[index]
  }

  return streak
}

const HabitsView: React.FC = () => {
  const { state } = useTaskManager()
  const { addHabit, deleteHabit, toggleHabitCompletion } = useHabitActions()
  const { t } = useI18n()
  const { confirm } = useConfirmation()
  const { settings } = useSettings()
  const [newHabitName, setNewHabitName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const today = toYYYYMMDD(new Date())
  const last30Days = useMemo(() => {
    const days: string[] = []
    for (let index = 29; index >= 0; index--) {
      const date = new Date()
      date.setDate(date.getDate() - index)
      days.push(toYYYYMMDD(date))
    }
    return days
  }, [])

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))
      return date
    })
  }, [])

  const handleAddHabit = () => {
    const name = newHabitName.trim()
    if (!name) return
    addHabit({ name })
    setNewHabitName('')
    setIsAdding(false)
  }

  const handleDeleteHabit = async (habitId: string, habitName: string) => {
    const isConfirmed = await confirm({
      title: t('habits.deleteConfirm.title' as TranslationKey, { name: habitName }),
      description: t('habits.deleteConfirm.description' as TranslationKey, { name: habitName }),
      confirmText: t('habits.deleteConfirm.confirm' as TranslationKey),
      cancelText: t('common.cancel' as TranslationKey),
      variant: 'destructive',
    })
    if (isConfirmed) deleteHabit(habitId)
  }

  const completedTodayCount = useMemo(
    () => state.habits.filter((habit) => habit.completions.includes(today)).length,
    [state.habits, today],
  )

  const longestStreak = useMemo(
    () =>
      state.habits.reduce(
        (maximum, habit) => Math.max(maximum, calculateStreak(habit.completions)),
        0,
      ),
    [state.habits],
  )

  const todayProgress =
    state.habits.length > 0
      ? Math.round((completedTodayCount / state.habits.length) * 100)
      : 0

  return (
    <AppPage>
      <AppPageHeader
        title={t('nav.habits')}
        subtitle={t('habits.subtitle')}
        hideOnMobile={false}
        actions={
          !isAdding ? (
            <Button type="button" size="sm" onClick={() => setIsAdding(true)} className="gap-2">
              <PlusIcon className="h-4 w-4" />
              <span>{t('habits.add')}</span>
            </Button>
          ) : null
        }
      />

      <AppPageMain className="space-y-5 py-4 md:space-y-6 md:py-6">
        {isAdding && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleAddHabit()
            }}
            className="rounded-xl border border-primary/30 bg-card p-4 shadow-sm"
          >
            <label className="mb-2 block text-sm font-medium" htmlFor="new-habit-name">
              {t('habit.name')}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="new-habit-name"
                value={newHabitName}
                onChange={(event) => setNewHabitName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setIsAdding(false)
                    setNewHabitName('')
                  }
                }}
                placeholder={t('habits.namePlaceholder')}
                autoFocus
                className="min-w-0 flex-1"
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={!newHabitName.trim()}>
                  {t('habits.add')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false)
                    setNewHabitName('')
                  }}
                >
                  {t('habits.cancel')}
                </Button>
              </div>
            </div>
          </form>
        )}

        <section className="overflow-hidden rounded-xl border border-border/60 bg-card/70">
          <div className="grid grid-cols-3 divide-x divide-border/60">
            <div className="px-3 py-3 sm:px-5 sm:py-4">
              <p className="text-xl font-semibold tabular-nums sm:text-2xl">{state.habits.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('habits.summary.total')}</p>
            </div>
            <div className="px-3 py-3 sm:px-5 sm:py-4">
              <p className="text-xl font-semibold tabular-nums text-[hsl(var(--color-habits-summary-completed))] sm:text-2xl">
                {completedTodayCount}/{state.habits.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t('habits.summary.completedToday')}</p>
            </div>
            <div className="px-3 py-3 sm:px-5 sm:py-4">
              <p className="text-xl font-semibold tabular-nums text-[hsl(var(--color-habits-summary-streak))] sm:text-2xl">
                {longestStreak}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t('habits.summary.longestStreak')}</p>
            </div>
          </div>
          {state.habits.length > 0 && (
            <div className="border-t border-border/60 px-4 py-3 sm:px-5">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('habits.summary.completedToday')}</span>
                <span className="font-medium tabular-nums text-foreground">{todayProgress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[hsl(var(--color-habits-summary-completed))] transition-[width] duration-300 motion-reduce:transition-none"
                  style={{ width: `${todayProgress}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {state.habits.length === 0 ? (
          <EmptyState
            title={t('habit.noHabits')}
            description={t('habit.createFirst')}
            action={
              <Button type="button" onClick={() => setIsAdding(true)} className="gap-2">
                <PlusIcon className="h-4 w-4" />
                {t('habits.add')}
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {state.habits.map((habit) => {
              const completedInLast30 = last30Days.filter((date) =>
                habit.completions.includes(date),
              ).length
              const completionRate = Math.round((completedInLast30 / 30) * 100)
              const isCompletedToday = habit.completions.includes(today)
              const streak = calculateStreak(habit.completions)

              return (
                <article
                  key={habit.id}
                  className={`overflow-hidden rounded-xl border bg-card shadow-sm transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none ${
                    isCompletedToday ? 'border-primary/30' : 'border-border/70'
                  }`}
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold sm:text-lg">{habit.name}</h2>
                        {streak > 0 && (
                          <span
                            className="rounded-full bg-[hsl(var(--color-habits-summary-streak)/0.1)] px-2.5 py-1 text-xs font-medium text-[hsl(var(--color-habits-summary-streak))]"
                            title={t('habits.streakTooltip')}
                          >
                            {t('habits.streakLabel', { count: streak })}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('habits.completionRate', { rate: completionRate, days: 30 })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => toggleHabitCompletion(habit.id, today)}
                        variant={isCompletedToday ? 'default' : 'outline'}
                        className="min-w-0 flex-1 gap-2 sm:flex-none"
                        aria-pressed={isCompletedToday}
                      >
                        {isCompletedToday && <CheckIcon className="h-4 w-4" />}
                        {isCompletedToday ? t('habits.completed') : t('habits.markComplete')}
                      </Button>
                      <IconButton
                        variant="destructive"
                        size="lg"
                        onClick={() => handleDeleteHabit(habit.id, habit.name)}
                        aria-label={t('habits.aria.deleteHabit')}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </IconButton>
                    </div>
                  </div>

                  <div className="border-t border-border/60 bg-muted/15 px-4 py-4 sm:px-5">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {t('habits.weeklyOverview')}
                      </p>
                      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {last7Days.map((date) => {
                          const dateKey = toYYYYMMDD(date)
                          const isCompleted = habit.completions.includes(dateKey)
                          const isTodayDate = dateKey === today
                          const dateLabel = date.toLocaleDateString(settings.language || undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })

                          return (
                            <button
                              key={dateKey}
                              type="button"
                              onClick={() => toggleHabitCompletion(habit.id, dateKey)}
                              aria-label={dateLabel}
                              aria-pressed={isCompleted}
                              className={`flex min-h-14 flex-col items-center justify-center rounded-lg border text-xs transition-[border-color,background-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none ${
                                isCompleted
                                  ? 'border-[hsl(var(--color-habits-completed))] bg-[hsl(var(--color-habits-completed))] text-white'
                                  : 'border-border bg-card text-muted-foreground hover:border-[hsl(var(--color-habits-completed-weak))] hover:text-foreground'
                              } ${isTodayDate ? 'ring-2 ring-primary/30 ring-offset-1 ring-offset-background' : ''}`}
                            >
                              <span>{date.toLocaleDateString(settings.language || undefined, { weekday: 'short' }).slice(0, 2)}</span>
                              <span className="mt-0.5 font-semibold tabular-nums">{date.getDate()}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-border/50 pt-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {t('habits.last30Days')}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {completedInLast30}/30
                        </span>
                      </div>
                      <div className="grid grid-cols-15 gap-1 sm:grid-cols-30">
                        {last30Days.map((date) => {
                          const isCompleted = habit.completions.includes(date)
                          const isTodayDate = date === today
                          const dateObject = new Date(`${date}T12:00:00`)
                          const dateLabel = dateObject.toLocaleDateString(settings.language || undefined)

                          return (
                            <button
                              key={date}
                              type="button"
                              onClick={() => toggleHabitCompletion(habit.id, date)}
                              title={dateLabel}
                              aria-label={dateLabel}
                              aria-pressed={isCompleted}
                              className={`aspect-square min-w-0 rounded-[4px] border transition-[background-color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none ${
                                isCompleted
                                  ? 'border-[hsl(var(--color-habits-completed))] bg-[hsl(var(--color-habits-completed))]'
                                  : 'border-border bg-muted/60 hover:border-[hsl(var(--color-habits-completed-weak))]'
                              } ${isTodayDate ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {longestStreak > 0 && (
          <p className="text-center text-xs text-muted-foreground">{t('habits.achievementHint')}</p>
        )}
      </AppPageMain>
    </AppPage>
  )
}

export default HabitsView
