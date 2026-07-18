'use client'

import React, { useMemo } from 'react'
import { useCalendar, type ViewMode } from '@/lib/hooks/use-calendar'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useTaskActions } from '@/lib/hooks/use-task-manager'
import { useI18n } from '@/lib/i18n/hooks'
import type { TranslationKey } from '@/lib/i18n/types'
import { useSettings } from '@/components/providers/settings-provider'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { PRIORITY_MAP } from '@/lib/task-constants'
import type { Task } from '@/types'
import { AppPage, AppPageContainer, AppPageMain } from '@/components/layout/app-page'

const CalendarView: React.FC = () => {
  const { t } = useI18n()
  const {
    currentDate,
    selectedDate,
    agendaStartDate,
    viewMode,
    draggedTaskId,
    dragOverDateKey,
    days,
    setCurrentDate,
    setSelectedDate,
    setAgendaStartDate,
    setViewMode,
    setDraggedTaskId,
    setDragOverDateKey,
    handlePrevMonth,
    handleNextMonth,
    handleToday,
    isCurrentMonth,
    isToday,
    isSelected,
    getTasksForDate,
    DAY_LABELS,
  } = useCalendar()

  const { state, dispatch } = useTaskManager()
  const { updateTask } = useTaskActions()
  const { tasks } = state
  const { settings } = useSettings()

  const locale = settings.language || undefined

  const agendaRangeEnd = useMemo(() => {
    const end = new Date(agendaStartDate)
    end.setDate(end.getDate() + 9)
    return end
  }, [agendaStartDate])

  const upcomingAgenda = useMemo(() => {
    const agenda: { date: Date; tasks: Task[] }[] = []
    for (let i = 0; i < 10; i++) {
      const date = new Date(agendaStartDate)
      date.setDate(agendaStartDate.getDate() + i)
      const tasks = getTasksForDate(date)
      agenda.push({ date, tasks })
    }
    return agenda
  }, [agendaStartDate, getTasksForDate])

  const selectedTasks = useMemo(() => {
    return getTasksForDate(selectedDate)
  }, [getTasksForDate, selectedDate])

  const parseCalendarTaskId = (taskId: string) => {
    const separatorIndex = taskId.lastIndexOf('_')
    const isInstance =
      separatorIndex > 0 && /^\d{4}-\d{2}-\d{2}$/.test(taskId.slice(separatorIndex + 1))
    return {
      isInstance,
      originalId: isInstance ? taskId.slice(0, separatorIndex) : taskId,
      instanceDateStr: isInstance ? taskId.slice(separatorIndex + 1) : null,
    }
  }

  const moveTaskToDate = (taskId: string, targetDate: Date) => {
    const { isInstance, originalId, instanceDateStr } = parseCalendarTaskId(taskId)
    const task = tasks.find(t => t.id === originalId)
    if (!task) return

    // Non-anchor recurring instances: do not move the whole series
    if (task.recurrence && isInstance && instanceDateStr) {
      const anchorDateStr = task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : ''
      if (instanceDateStr !== anchorDateStr) {
        return
      }
    }

    const originalDate = task.dueDate ? new Date(task.dueDate) : new Date()
    const newDueDate = new Date(targetDate)
    // Preserve original time component
    newDueDate.setHours(originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds(), originalDate.getMilliseconds())

    void updateTask({
      ...task,
      dueDate: newDueDate.toISOString(),
    })
  }

  const handleTaskDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
    setDraggedTaskId(taskId)
  }

  const handleTaskDragEnd = () => {
    setDraggedTaskId(null)
    setDragOverDateKey(null)
  }

  const handleTaskClick = (task: Task) => {
    const { originalId } = parseCalendarTaskId(task.id)
    dispatch({ type: 'SET_SELECTED_TASK', payload: originalId })
  }

  const canDragTask = (task: Task) => {
    const { isInstance, originalId, instanceDateStr } = parseCalendarTaskId(task.id)
    if (!isInstance || !instanceDateStr) return true
    const master = tasks.find(t => t.id === originalId)
    if (!master?.recurrence) return true
    const anchorDateStr = master.dueDate
      ? new Date(master.dueDate).toISOString().slice(0, 10)
      : ''
    return instanceDateStr === anchorDateStr
  }

  const renderTaskPill = (task: Task) => {
    const priority = PRIORITY_MAP[task.priority || 'none']
    const bg = priority.checkboxBorderValue

    const isDraggingThis = draggedTaskId === task.id
    const draggable = canDragTask(task)

    const timeLabel = task.dueDate
      ? new Date(task.dueDate).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
      : null

    return (
      <div
        key={task.id}
        draggable={draggable}
        onDragStart={draggable ? (e) => handleTaskDragStart(e, task.id) : undefined}
        onDragEnd={draggable ? handleTaskDragEnd : undefined}
        className={`w-full text-[10px] px-2 py-0.5 rounded-md text-background flex items-center gap-1 shadow-sm transition-opacity ${
          draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
        } ${isDraggingThis ? 'opacity-60' : ''}`}
        style={{ backgroundColor: bg }}
        title={task.title}
        onClick={() => handleTaskClick(task)}
      >
        {timeLabel && (
          <span className="shrink-0 opacity-90 text-[9px]">
            {timeLabel}
          </span>
        )}
        <span className="truncate">
          {task.title}
        </span>
      </div>
    )
  }

  return (
    <AppPage>
      <AppPageContainer>
        <header className="py-4 md:py-6 border-b border-border shrink-0">
          <div className="flex flex-col gap-2 md:gap-4 md:flex-row md:items-center md:justify-between mb-3 md:mb-6">
            <div>
              <h1 className="hidden md:block text-xl md:text-3xl font-bold">{t('nav.calendar')}</h1>
              <p className="text-sm text-muted-foreground hidden md:block">{t('calendar.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end md:justify-start">
              <span className="text-sm font-medium text-muted-foreground md:hidden">
                {viewMode === 'month'
                  ? currentDate.toLocaleDateString(locale, { month: 'short', year: 'numeric' })
                  : `${agendaStartDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${agendaRangeEnd.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}`}
              </span>
              <button
                onClick={handlePrevMonth}
                className="p-1.5 md:p-2 rounded-lg hover:bg-secondary transition-colors"
                aria-label={t('calendar.prevMonth' as TranslationKey)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-secondary rounded-lg hover:bg-muted transition-colors text-sm font-medium"
              >
                {t('calendar.today')}
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 md:p-2 rounded-lg hover:bg-secondary transition-colors"
                aria-label={t('calendar.nextMonth' as TranslationKey)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="flex items-center rounded-full border border-border bg-muted/40 p-0.5">
                {(['month', 'agenda'] as ViewMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setViewMode(mode)
                      if (mode === 'agenda') {
                        const base = new Date(selectedDate)
                        base.setHours(0, 0, 0, 0)
                        setAgendaStartDate(base)
                      } else {
                        const monthAnchor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
                        setCurrentDate(monthAnchor)
                        setSelectedDate(monthAnchor)
                      }
                    }}
                    className={`px-3 py-1 text-xs md:text-sm font-medium rounded-full border transition-colors ${
                      viewMode === mode
                        ? 'bg-background text-primary border-2 border-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-background/60 border-transparent'
                    }`}
                  >
                    {mode === 'month' ? t('calendar.view.month') : t('calendar.view.agenda')}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <h2 className="hidden md:block text-2xl font-semibold">
            {viewMode === 'month'
              ? currentDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
              : `${agendaStartDate.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })} – ${agendaRangeEnd.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}`}
          </h2>
        </header>
      </AppPageContainer>
      <AppPageMain className="py-4 md:py-6 space-y-4 md:space-y-6">
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
                  const isSelectedDate = isSelected(date)
                  const dateKey = date.toDateString()
                  const isDragOverDay = dragOverDateKey === dateKey

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDragOverDateKey(dateKey)
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault()
                        if (dragOverDateKey === dateKey) {
                          setDragOverDateKey(null)
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        const taskId = e.dataTransfer.getData('taskId')
                        if (taskId) {
                          moveTaskToDate(taskId, date)
                        }
                        setDraggedTaskId(null)
                        setDragOverDateKey(null)
                      }}
                      className={`min-h-[130px] p-1.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        ${isSelectedDate ? 'border-2 border-primary bg-primary/10 z-10 relative' : 'border-r border-b border-border'}
                        ${isCurrentMonthDate ? 'bg-card' : 'bg-muted/30'}
                        ${isTodayDate && !isSelectedDate ? 'bg-primary/10 border-primary' : ''}
                        ${isDragOverDay ? 'outline-2 outline-primary/60 bg-primary/5 relative z-10' : ''}
                      `}
                    >
                      <div className="flex flex-col h-full">
                        <div
                          className={`text-xs font-semibold mb-1 flex items-center gap-1
                            ${isTodayDate ? 'text-primary' : isCurrentMonthDate ? 'text-foreground' : 'text-muted-foreground'}
                          `}
                        >
                          <span>{date.getDate()}</span>
                          {tasks.length > 0 && (
                            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {tasks.length}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-col gap-1">
                          {tasks.slice(0, 2).map(task => renderTaskPill(task))}
                          {tasks.length > 2 && (
                            <div className="text-[11px] text-muted-foreground">
                              {t('calendar.moreTasks', { count: tasks.length - 2 })}
                            </div>
                          )}
                        </div>
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
                    <h3 className="font-semibold">{t('calendar.selectedDayTasks')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                {selectedTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('calendar.noTasks')}</p>
                ) : (
                  <div className="space-y-2">
                    {selectedTasks.map(task => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => handleTaskClick(task)}
                        className="w-full flex items-center justify-between rounded-xl border border-border/60 p-3 bg-muted/30 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">{task.title}</p>
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(task.dueDate).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted/40"
                          style={{ color: PRIORITY_MAP[task.priority || 'none'].checkboxBorderValue }}
                        >
                          {t(PRIORITY_MAP[task.priority || 'none'].label)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <h3 className="font-semibold mb-4">{t('calendar.legend.title')}</h3>
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
              <h3 className="font-semibold">{t('calendar.upcomingAgenda')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('calendar.upcomingSubtitle')}
              </p>
            </div>
            <div className="divide-y divide-border">
              {upcomingAgenda.map(({ date, tasks }) => (
                <div key={date.toISOString()} className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tasks.length} {tasks.length === 1 ? t('calendar.taskCountSingle') : t('calendar.taskCountPlural', { count: tasks.length })}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {isToday(date) ? t('calendar.today') : ''}
                    </span>
                  </div>
                  {tasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t('calendar.noTasks')}</p>
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
      </AppPageMain>
    </AppPage>
  )
}

export default CalendarView

