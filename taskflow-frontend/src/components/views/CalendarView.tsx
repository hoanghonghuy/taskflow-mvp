'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { isSameDay } from '@/lib/utils/date-helpers'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { PRIORITY_MAP } from '@/lib/constants'
import type { Task } from '@/types'

type ViewMode = 'month' | 'agenda'

const DAY_LABELS = Array.from({ length: 7 }).map((_, index) =>
  new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(2024, 0, index + 1))
)

const CalendarView: React.FC = () => {
  const { state } = useTaskManager()
  const { t } = useI18n()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  const days = useMemo(() => {
    const daysArray: Date[] = []
    // Add previous month's days to fill the first week
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      daysArray.push(new Date(year, month - 1, prevMonthLastDay - i))
    }
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(new Date(year, month, i))
    }
    // Add next month's days to fill the last week
    const remainingDays = 42 - daysArray.length
    for (let i = 1; i <= remainingDays; i++) {
      daysArray.push(new Date(year, month + 1, i))
    }
    return daysArray
  }, [year, month, daysInMonth, startingDayOfWeek])

  const tasksByDate = useMemo(() => {
    const map = new Map<string, typeof state.tasks>()
    state.tasks.forEach(task => {
      if (task.dueDate) {
        const date = new Date(task.dueDate)
        const key = date.toISOString().split('T')[0]
        if (!map.has(key)) {
          map.set(key, [])
        }
        map.get(key)!.push(task)
      }
    })
    return map
  }, [state.tasks])

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return isSameDay(date, today)
  }

  const isCurrentMonth = (date: Date) => date.getMonth() === month

  const getTasksForDate = useCallback(
    (date: Date) => {
      const key = date.toISOString().split('T')[0]
      return tasksByDate.get(key) || []
    },
    [tasksByDate]
  )

  const selectedTasks = getTasksForDate(selectedDate)

  const upcomingAgenda = useMemo(() => {
    const agenda: { date: Date; tasks: Task[] }[] = []
    const today = new Date()
    for (let i = 0; i < 10; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const tasks = getTasksForDate(date)
      agenda.push({ date, tasks })
    }
    return agenda
  }, [getTasksForDate])

  const renderTaskPill = (task: Task) => {
    const priority = PRIORITY_MAP[task.priority || 'none']
    const bg = priority.checkboxBorderValue

    return (
      <div
        key={task.id}
        className="text-xs px-2 py-1 rounded-full text-background truncate"
        style={{ backgroundColor: bg }}
        title={task.title}
      >
        {task.title}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <header className="p-6 border-b border-border flex-shrink-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{t('nav.calendar')}</h1>
            <p className="text-muted-foreground">{t('calendar.subtitle') || 'Calendar view of your tasks'}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-secondary rounded-lg hover:bg-muted transition-colors text-sm font-medium"
            >
              {t('calendar.today') || 'Today'}
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="flex items-center rounded-lg border border-border bg-card">
              {(['month', 'agenda'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                    viewMode === mode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  {mode === 'month' ? t('calendar.view.month') || 'Month' : t('calendar.view.agenda') || 'Agenda'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-semibold">
          {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
      </header>
      <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6 space-y-6">
        {viewMode === 'month' ? (
          <>
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                {DAY_LABELS.map(label => (
                  <div key={label} className="p-3 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((date, index) => {
                  const tasks = getTasksForDate(date)
                  const isTodayDate = isToday(date)
                  const isCurrentMonthDate = isCurrentMonth(date)
                  const isSelected = isSameDay(date, selectedDate)

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      className={`min-h-[130px] border-r border-b border-border p-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        ${isCurrentMonthDate ? 'bg-card' : 'bg-muted/30'}
                        ${isTodayDate ? 'bg-primary/10 border-primary' : ''}
                        ${isSelected ? 'ring-2 ring-primary/70 z-10 relative' : ''}
                      `}
                    >
                      <div
                        className={`text-sm font-semibold mb-2 flex items-center gap-1
                          ${isTodayDate ? 'text-primary' : isCurrentMonthDate ? 'text-foreground' : 'text-muted-foreground'}
                        `}
                      >
                        {date.getDate()}
                        {tasks.length > 0 && (
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {tasks.length}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {tasks.slice(0, 2).map(task => renderTaskPill(task))}
                        {tasks.length > 2 && (
                          <div className="text-[11px] text-muted-foreground">
                            +{tasks.length - 2} {t('calendar.moreTasks', { count: tasks.length - 2 })}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">{t('calendar.selectedDayTasks') || 'Tasks for selected day'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                {selectedTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('calendar.noTasks') || 'No tasks scheduled for this day.'}</p>
                ) : (
                  <div className="space-y-2">
                    {selectedTasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between rounded-xl border border-border/60 p-3 bg-muted/30"
                      >
                        <div>
                          <p className="font-medium text-sm">{task.title}</p>
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(task.dueDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{ backgroundColor: `${PRIORITY_MAP[task.priority || 'none'].checkboxBorderValue}20`, color: PRIORITY_MAP[task.priority || 'none'].checkboxBorderValue }}
                        >
                          {t(PRIORITY_MAP[task.priority || 'none'].label)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <h3 className="font-semibold mb-4">{t('calendar.legend.title') || 'Priority Legend'}</h3>
                <div className="space-y-3 text-sm">
                  {(['urgent', 'high', 'medium', 'low', 'none'] as const).map(priority => (
                    <div key={priority} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: PRIORITY_MAP[priority].checkboxBorderValue }}
                        />
                        <span>{t(PRIORITY_MAP[priority].label)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-sm">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">{t('calendar.upcomingAgenda') || 'Upcoming agenda'}</h3>
              <p className="text-sm text-muted-foreground">{t('calendar.upcomingSubtitle') || 'Next 10 days of scheduled work.'}</p>
            </div>
            <div className="divide-y divide-border">
              {upcomingAgenda.map(({ date, tasks }) => (
                <div key={date.toISOString()} className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tasks.length} {tasks.length === 1 ? t('calendar.taskCountSingle') || 'task' : t('calendar.taskCountPlural', { count: tasks.length }) || 'tasks'}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {isToday(date) ? t('calendar.today') || 'Today' : ''}
                    </span>
                  </div>
                  {tasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t('calendar.noTasks') || 'No tasks scheduled.'}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tasks.map(task => renderTaskPill(task))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default CalendarView

