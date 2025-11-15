'use client'

import React, { useState, useMemo } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import TaskItem from '@/components/task/TaskItem'
import { isSameDay, addDays } from '@/lib/utils/date-helpers'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

const CalendarView: React.FC = () => {
  const { state } = useTaskManager()
  const { t } = useI18n()
  const [currentDate, setCurrentDate] = useState(new Date())

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

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <header className="p-6 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{t('nav.calendar')}</h1>
            <p className="text-muted-foreground">Calendar view of your tasks</p>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
        <h2 className="text-2xl font-semibold">
          {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
      </header>
      <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center font-semibold text-sm border-r border-border last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((date, index) => {
              const dateKey = date.toISOString().split('T')[0]
              const tasks = tasksByDate.get(dateKey) || []
              const isTodayDate = isToday(date)
              const isCurrentMonthDate = isCurrentMonth(date)

              return (
                <div
                  key={index}
                  className={`
                    min-h-[120px] border-r border-b border-border last:border-r-0 p-2
                    ${isCurrentMonthDate ? 'bg-card' : 'bg-secondary/30'}
                    ${isTodayDate ? 'bg-primary/10 border-primary border-2' : ''}
                  `}
                >
                  <div className={`
                    text-sm font-semibold mb-1
                    ${isTodayDate ? 'text-primary' : isCurrentMonthDate ? 'text-foreground' : 'text-muted-foreground'}
                  `}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {tasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        className="text-xs p-1 bg-primary/20 text-primary rounded truncate"
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                    {tasks.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{tasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

export default CalendarView

