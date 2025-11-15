'use client'

import React, { useState, useMemo } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useHabitActions } from '@/components/providers/task-manager-provider'
import { PlusIcon, TrashIcon } from '@/lib/constants'
import { toYYYYMMDD } from '@/lib/utils/date-helpers'

const HabitsView: React.FC = () => {
  const { state } = useTaskManager()
  const { addHabit, deleteHabit, toggleHabitCompletion } = useHabitActions()
  const { t } = useI18n()
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

  const getCompletionRate = (habitId: string) => {
    const habit = state.habits.find(h => h.id === habitId)
    if (!habit) return 0
    const completedInLast30 = last30Days.filter(date => habit.completions.includes(date)).length
    return Math.round((completedInLast30 / 30) * 100)
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <header className="p-6 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('nav.habits')}</h1>
            <p className="text-muted-foreground">Track your daily habits</p>
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
      <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
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
                <div key={habit.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{habit.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('habits.completionRate', { rate: completionRate, days: 30 })}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={t('habits.aria.deleteHabit')}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => handleToggleCompletion(habit.id, today)}
                      className={`
                        px-4 py-2 rounded-lg font-medium transition-colors
                        ${isCompletedToday
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-muted'
                        }
                      `}
                    >
                      {isCompletedToday ? t('habits.completed') : t('habits.markComplete')}
                    </button>
                  </div>
                  <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-1">
                    {last30Days.map(date => {
                      const isCompleted = habit.completions.includes(date)
                      const isTodayDate = date === today
                      return (
                        <div
                          key={date}
                          className={`
                            aspect-square rounded
                            ${isCompleted ? 'bg-primary' : 'bg-secondary'}
                            ${isTodayDate ? 'ring-2 ring-primary ring-offset-1' : ''}
                            cursor-pointer hover:opacity-80 transition-opacity
                          `}
                          onClick={() => handleToggleCompletion(habit.id, date)}
                          title={new Date(date).toLocaleDateString()}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default HabitsView

