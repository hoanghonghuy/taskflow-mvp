'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useSettings } from '@/components/providers/settings-provider'
import { isSameDay } from '@/lib/utils/date-helpers'
import { expandRecurringTask } from '@/lib/utils/recurrence'
import type { Task } from '@/types'

type ViewMode = 'month' | 'agenda'

interface CalendarDateInfo {
  year: number
  month: number
  firstDayOfMonth: Date
  lastDayOfMonth: Date
  daysInMonth: number
  startingDayOfWeek: number
}

interface UseCalendarReturn {
  // State
  currentDate: Date
  selectedDate: Date
  agendaStartDate: Date
  viewMode: ViewMode
  draggedTaskId: string | null
  dragOverDateKey: string | null
  
  // Date calculations
  dateInfo: CalendarDateInfo
  days: Date[]
  tasksByDate: Map<string, Task[]>
  
  // Actions
  setCurrentDate: (date: Date) => void
  setSelectedDate: (date: Date) => void
  setAgendaStartDate: (date: Date) => void
  setViewMode: (mode: ViewMode) => void
  setDraggedTaskId: (id: string | null) => void
  setDragOverDateKey: (key: string | null) => void
  
  // Navigation
  handlePrevMonth: () => void
  handleNextMonth: () => void
  handleToday: () => void
  goToMonth: (year: number, month: number) => void
  
  // Utilities
  shiftAgendaRange: (days: number) => void
  isCurrentMonth: (date: Date) => boolean
  isToday: (date: Date) => boolean
  isSelected: (date: Date) => boolean
  getTasksForDate: (date: Date) => Task[]
  
  // Constants
  DAY_LABELS: string[]
}

export const useCalendar = (): UseCalendarReturn => {
  const { state } = useTaskManager()
  const { tasks } = state
  const { settings } = useSettings()
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [agendaStartDate, setAgendaStartDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null)

  // Date calculations
  const dateInfo = useMemo((): CalendarDateInfo => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const startingDayOfWeek = firstDayOfMonth.getDay()

    return {
      year,
      month,
      firstDayOfMonth,
      lastDayOfMonth,
      daysInMonth,
      startingDayOfWeek,
    }
  }, [currentDate])

  // Generate calendar days array
  const days = useMemo(() => {
    const daysArray: Date[] = []
    const { year, month, daysInMonth, startingDayOfWeek } = dateInfo
    
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
  }, [dateInfo])

  // Localized day labels based on app language
  const dayLabels = useMemo(() => {
    const locale = settings.language || undefined
    return Array.from({ length: 7 }).map((_, index) =>
      new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, index + 1))
    )
  }, [settings.language])

  // Group tasks by date for efficient lookup
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()

    // Month grid range, plus agenda window so far-from-month agenda still expands
    const monthMin = new Date(days[0])
    monthMin.setDate(monthMin.getDate() - 7)
    const monthMax = new Date(days[days.length - 1])
    monthMax.setDate(monthMax.getDate() + 7)

    const agendaMin = new Date(agendaStartDate)
    agendaMin.setHours(0, 0, 0, 0)
    agendaMin.setDate(agendaMin.getDate() - 7)
    const agendaMax = new Date(agendaStartDate)
    agendaMax.setHours(0, 0, 0, 0)
    agendaMax.setDate(agendaMax.getDate() + 16)

    const minDate = monthMin < agendaMin ? monthMin : agendaMin
    const maxDate = monthMax > agendaMax ? monthMax : agendaMax

    tasks.forEach(task => {
      if (!task.dueDate) return

      if (task.recurrence) {
        // Only expanded instances — avoids duplicate pill on the anchor day
        const instances = expandRecurringTask(task, minDate, maxDate, 60)
        instances.forEach(({ id, instanceDate }) => {
          const instanceKey = instanceDate.toDateString()
          if (!map.has(instanceKey)) {
            map.set(instanceKey, [])
          }
          map.get(instanceKey)!.push({
            ...task,
            id,
            dueDate: instanceDate.toISOString(),
          })
        })
        return
      }

      const date = new Date(task.dueDate)
      const key = date.toDateString()
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(task)
    })
    return map
  }, [tasks, days, agendaStartDate])

  // Agenda navigation
  const shiftAgendaRange = useCallback((days: number) => {
    const updated = new Date(agendaStartDate)
    updated.setDate(updated.getDate() + days)
    updated.setHours(0, 0, 0, 0)
    setAgendaStartDate(updated)
    setSelectedDate(updated)
  }, [agendaStartDate])

  // Navigation handlers
  const handlePrevMonth = useCallback(() => {
    if (viewMode === 'agenda') {
      shiftAgendaRange(-1)
      return
    }
    const { year, month } = dateInfo
    setCurrentDate(new Date(year, month - 1, 1))
  }, [viewMode, dateInfo, shiftAgendaRange])

  const handleNextMonth = useCallback(() => {
    if (viewMode === 'agenda') {
      shiftAgendaRange(1)
      return
    }
    const { year, month } = dateInfo
    setCurrentDate(new Date(year, month + 1, 1))
  }, [viewMode, dateInfo, shiftAgendaRange])

  const handleToday = useCallback(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (viewMode === 'agenda') {
      setAgendaStartDate(today)
      setSelectedDate(today)
    } else {
      setCurrentDate(today)
      setSelectedDate(today)
    }
  }, [viewMode])

  const goToMonth = useCallback((year: number, month: number) => {
    setCurrentDate(new Date(year, month, 1))
  }, [])

  // Utility functions
  const isCurrentMonth = useCallback((date: Date) => {
    return date.getMonth() === dateInfo.month && date.getFullYear() === dateInfo.year
  }, [dateInfo])

  const isToday = useCallback((date: Date) => {
    const today = new Date()
    return isSameDay(date, today)
  }, [])

  const isSelected = useCallback((date: Date) => {
    return isSameDay(date, selectedDate)
  }, [selectedDate])

  const getTasksForDate = useCallback((date: Date) => {
    return tasksByDate.get(date.toDateString()) || []
  }, [tasksByDate])

  return {
    // State
    currentDate,
    selectedDate,
    agendaStartDate,
    viewMode,
    draggedTaskId,
    dragOverDateKey,
    
    // Date calculations
    dateInfo,
    days,
    tasksByDate,
    
    // Actions
    setCurrentDate,
    setSelectedDate,
    setAgendaStartDate,
    setViewMode,
    setDraggedTaskId,
    setDragOverDateKey,
    
    // Navigation
    handlePrevMonth,
    handleNextMonth,
    handleToday,
    goToMonth,
    
    // Utilities
    shiftAgendaRange,
    isCurrentMonth,
    isToday,
    isSelected,
    getTasksForDate,
    
    // Constants
    DAY_LABELS: dayLabels,
  }
}

export type { ViewMode, CalendarDateInfo, UseCalendarReturn }
