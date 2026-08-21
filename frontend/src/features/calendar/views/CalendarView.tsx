'use client'

import React, { useEffect, useMemo } from 'react'
import { useCalendar } from '@/lib/hooks/use-calendar'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useUser } from '@/components/providers/user-provider'
import { useTaskActions } from '@/lib/hooks/use-task-manager'
import { useI18n } from '@/lib/i18n/hooks'
import type { TranslationKey } from '@/lib/i18n/types'
import { useSettings } from '@/components/providers/settings-provider'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { PRIORITY_MAP } from '@/lib/task-constants'
import { isSharedListMember } from '@/lib/utils/list-access'
import type { Task } from '@/types'
import { AppPage, AppPageMain } from '@/components/layout/app-page'
import { AppPageHeader } from '@/components/layout/app-page-header'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'

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
  const { user } = useUser()
  const locale = settings.language || undefined

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const syncMobileView = (matches: boolean) => {
      if (!matches) return
      setViewMode('agenda')
      const base = new Date()
      base.setHours(0, 0, 0, 0)
      setAgendaStartDate(base)
      setSelectedDate(base)
    }

    syncMobileView(mediaQuery.matches)
    const handleChange = (event: MediaQueryListEvent) => syncMobileView(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [setAgendaStartDate, setSelectedDate, setViewMode])

  const agendaRangeEnd = useMemo(() => {
    const end = new Date(agendaStartDate)
    end.setDate(end.getDate() + 9)
    return end
  }, [agendaStartDate])

  const upcomingAgenda = useMemo(() => {
    return Array.from({ length: 10 }, (_, index) => {
      const date = new Date(agendaStartDate)
      date.setDate(agendaStartDate.getDate() + index)
      return { date, tasks: getTasksForDate(date) }
    })
  }, [agendaStartDate, getTasksForDate])

  const selectedTasks = useMemo(
    () => getTasksForDate(selectedDate),
    [getTasksForDate, selectedDate],
  )

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

  const canDragTask = (task: Task) => {
    const { isInstance, originalId, instanceDateStr } = parseCalendarTaskId(task.id)
    const master = tasks.find((item) => item.id === originalId) ?? task
    const parentList = state.lists.find((list) => list.id === master.listId)
    if (isSharedListMember(parentList, user?.id)) return false
    if (!isInstance || !instanceDateStr || !master.recurrence) return true
    const anchorDateStr = master.dueDate
      ? new Date(master.dueDate).toISOString().slice(0, 10)
      : ''
    return instanceDateStr === anchorDateStr
  }

  const moveTaskToDate = (taskId: string, targetDate: Date) => {
    const { isInstance, originalId, instanceDateStr } = parseCalendarTaskId(taskId)
    const task = tasks.find((item) => item.id === originalId)
    if (!task) return

    const parentList = state.lists.find((list) => list.id === task.listId)
    if (isSharedListMember(parentList, user?.id)) return

    if (task.recurrence && isInstance && instanceDateStr) {
      const anchorDateStr = task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : ''
      if (instanceDateStr !== anchorDateStr) return
    }

    const originalDate = task.dueDate ? new Date(task.dueDate) : new Date()
    const newDueDate = new Date(targetDate)
    newDueDate.setHours(
      originalDate.getHours(),
      originalDate.getMinutes(),
      originalDate.getSeconds(),
      originalDate.getMilliseconds(),
    )
    void updateTask({ ...task, dueDate: newDueDate.toISOString() })
  }

  const handleTaskClick = (task: Task) => {
    const { originalId } = parseCalendarTaskId(task.id)
    dispatch({ type: 'SET_SELECTED_TASK', payload: originalId })
  }

  const renderTaskPill = (task: Task) => {
    const priority = PRIORITY_MAP[task.priority || 'none']
    const isDraggingThis = draggedTaskId === task.id
    const draggable = canDragTask(task)
    const timeLabel = task.dueDate
      ? new Date(task.dueDate).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
      : null

    return (
      <button
        type="button"
        key={task.id}
        draggable={draggable}
        onDragStart={
          draggable
            ? (event) => {
                event.dataTransfer.setData('taskId', task.id)
                setDraggedTaskId(task.id)
              }
            : undefined
        }
        onDragEnd={
          draggable
            ? () => {
                setDraggedTaskId(null)
                setDragOverDateKey(null)
              }
            : undefined
        }
        aria-label={timeLabel ? `${timeLabel}, ${task.title}` : task.title}
        onClick={() => handleTaskClick(task)}
        className={`flex min-h-7 w-full items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-left text-xs text-foreground shadow-sm transition-[opacity,background-color,border-color] duration-150 hover:bg-secondary/60 motion-reduce:transition-none ${
          draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
        } ${isDraggingThis ? 'opacity-50' : ''}`}
        style={{ borderLeftColor: priority.checkboxBorderValue, borderLeftWidth: '3px' }}
        title={task.title}
      >
        {timeLabel && <span className="shrink-0 text-[10px] text-muted-foreground">{timeLabel}</span>}
        <span className="truncate font-medium">{task.title}</span>
      </button>
    )
  }

  const rangeLabel =
    viewMode === 'month'
      ? currentDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
      : `${agendaStartDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – ${agendaRangeEnd.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}`

  return (
    <AppPage>
      <AppPageHeader
        title={t('nav.calendar')}
        subtitle={t('calendar.subtitle')}
        hideOnMobile={false}
      />

      <AppPageMain className="space-y-4 py-4 md:space-y-6 md:py-6">
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold sm:text-lg">{rangeLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-border/60 bg-background p-0.5">
              <IconButton
                type="button"
                size="md"
                variant="toolbar"
                onClick={handlePrevMonth}
                aria-label={t('calendar.prevMonth' as TranslationKey)}
              >
                <ChevronLeft className="h-4 w-4" />
              </IconButton>
              <Button type="button" variant="ghost" size="sm" onClick={handleToday}>
                {t('calendar.today')}
              </Button>
              <IconButton
                type="button"
                size="md"
                variant="toolbar"
                onClick={handleNextMonth}
                aria-label={t('calendar.nextMonth' as TranslationKey)}
              >
                <ChevronRight className="h-4 w-4" />
              </IconButton>
            </div>

            <SegmentedControl
              shape="pill"
              size="sm"
              aria-label={t('calendar.view.month')}
              value={viewMode}
              onValueChange={(mode) => {
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
              options={[
                { value: 'month', label: t('calendar.view.month') },
                { value: 'agenda', label: t('calendar.view.agenda') },
              ]}
            />
          </div>
        </div>

        {viewMode === 'month' ? (
          <>
            <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
              <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                {DAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="p-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs md:p-3"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {days.map((date) => {
                  const dateTasks = getTasksForDate(date)
                  const isTodayDate = isToday(date)
                  const isCurrentMonthDate = isCurrentMonth(date)
                  const isSelectedDate = isSelected(date)
                  const dateKey = date.toDateString()
                  const isDragOverDay = dragOverDateKey === dateKey

                  return (
                    <button
                      type="button"
                      key={date.toISOString()}
                      aria-label={date.toLocaleDateString(locale, { dateStyle: 'full' })}
                      aria-pressed={isSelectedDate}
                      aria-current={isTodayDate ? 'date' : undefined}
                      onClick={() => setSelectedDate(date)}
                      onDragOver={(event) => {
                        event.preventDefault()
                        setDragOverDateKey(dateKey)
                      }}
                      onDragLeave={() => {
                        if (dragOverDateKey === dateKey) setDragOverDateKey(null)
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        const taskId = event.dataTransfer.getData('taskId')
                        if (taskId) moveTaskToDate(taskId, date)
                        setDraggedTaskId(null)
                        setDragOverDateKey(null)
                      }}
                      className={`relative min-h-[54px] border-b border-r border-border p-1 text-left transition-[background-color,box-shadow] duration-150 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none md:min-h-[130px] md:p-1.5 ${
                        isCurrentMonthDate ? 'bg-card' : 'bg-muted/25 text-muted-foreground'
                      } ${isSelectedDate ? 'z-10 bg-primary/5 shadow-[inset_0_0_0_2px_hsl(var(--primary))]' : ''} ${
                        isTodayDate && !isSelectedDate ? 'bg-primary/[0.035]' : ''
                      } ${isDragOverDay ? 'z-20 bg-primary/10 shadow-[inset_0_0_0_2px_hsl(var(--primary))]' : ''}`}
                    >
                      <div className="flex h-full flex-col">
                        <div className="mb-0.5 flex items-center gap-1 md:mb-1">
                          <span
                            className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold ${
                              isTodayDate
                                ? 'bg-primary text-primary-foreground'
                                : isSelectedDate
                                  ? 'text-primary'
                                  : ''
                            }`}
                          >
                            {date.getDate()}
                          </span>
                          {dateTasks.length > 0 && (
                            <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {dateTasks.length}
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 hidden flex-col gap-1 md:flex">
                          {dateTasks.slice(0, 2).map(renderTaskPill)}
                          {dateTasks.length > 2 && (
                            <span className="px-1 text-[11px] text-muted-foreground">
                              {t('calendar.moreTasks', { count: dateTasks.length - 2 })}
                            </span>
                          )}
                        </div>

                        {dateTasks.length > 0 && (
                          <div className="mt-auto flex justify-center gap-0.5 pb-0.5 md:hidden" aria-hidden>
                            {dateTasks.slice(0, 3).map((task) => (
                              <span key={task.id} className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <section className="rounded-xl border border-border/70 bg-card p-4 shadow-sm lg:col-span-2">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold">{t('calendar.selectedDayTasks')}</h2>
                    <p className="truncate text-sm text-muted-foreground">
                      {selectedDate.toLocaleDateString(locale, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {selectedTasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                    {t('calendar.noTasks')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedTasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => handleTaskClick(task)}
                        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{task.title}</p>
                          {task.dueDate && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(task.dueDate).toLocaleTimeString(locale, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                        <span
                          className="shrink-0 rounded-full bg-muted/60 px-2 py-1 text-[11px] font-medium"
                          style={{ color: PRIORITY_MAP[task.priority || 'none'].checkboxBorderValue }}
                        >
                          {t(PRIORITY_MAP[task.priority || 'none'].label)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <aside className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                <h2 className="mb-4 font-semibold">{t('calendar.legend.title')}</h2>
                <div className="space-y-3 text-sm">
                  {(['urgent', 'high', 'medium', 'low', 'none'] as const).map((priority) => (
                    <div key={priority} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: PRIORITY_MAP[priority].checkboxBorderValue }}
                      />
                      <span>{t(PRIORITY_MAP[priority].label)}</span>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </>
        ) : (
          <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <div className="border-b border-border px-4 py-4 sm:px-5">
              <h2 className="font-semibold">{t('calendar.upcomingAgenda')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('calendar.upcomingSubtitle')}</p>
            </div>

            <div className="divide-y divide-border/60">
              {upcomingAgenda.map(({ date, tasks: dateTasks }) => {
                const today = isToday(date)
                return (
                  <div
                    key={date.toISOString()}
                    className={`p-4 sm:p-5 ${today ? 'bg-primary/[0.035]' : ''}`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">
                            {date.toLocaleDateString(locale, {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </h3>
                          {today && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                              {t('calendar.today')}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {dateTasks.length === 1
                            ? `1 ${t('calendar.taskCountSingle')}`
                            : t('calendar.taskCountPlural', { count: dateTasks.length })}
                        </p>
                      </div>
                    </div>

                    {dateTasks.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-xs text-muted-foreground">
                        {t('calendar.noTasks')}
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {dateTasks.map(renderTaskPill)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </AppPageMain>
    </AppPage>
  )
}

export default CalendarView
