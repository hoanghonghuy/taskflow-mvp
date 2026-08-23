'use client'

import React, { useMemo, useState } from 'react'
import { PauseIcon, SquareIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  usePomodoroActions,
  useTaskManager,
} from '@/components/providers/task-manager-provider'
import { useUser } from '@/components/providers/user-provider'
import { useI18n } from '@/lib/i18n/hooks'
import {
  CalendarDayIcon,
  CheckCircleIcon,
  FlagIcon,
  InboxIcon,
  PlayCircleIcon,
  SearchIcon,
  SettingsIcon,
  StopwatchIcon,
  SunIcon,
} from '@/lib/icons'
import { toYYYYMMDD } from '@/lib/utils/date-helpers'
import { AppPage, AppPageMain } from '@/components/layout/app-page'
import { AppPageHeader } from '@/components/layout/app-page-header'
import { AccessibleModalSurface } from '@/components/ui/accessible-modal-surface'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { StatCard } from '@/components/ui/stat-card'
import type { Habit, Task } from '@/types'
import type { TranslationKey } from '@/lib/i18n/types'

const TIMER_RADIUS = 45
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS

type TaskFilter = 'today' | 'tomorrow' | 'next7Days' | 'recent' | 'assignedToMe' | 'list'
type StatisticsTab = 'overview' | 'task' | 'focus'

function sessionVisuals(session: 'focus' | 'shortBreak' | 'longBreak') {
  switch (session) {
    case 'focus':
      return {
        text: 'text-[hsl(var(--color-pomodoro-focus))]',
        surface: 'bg-[hsl(var(--color-pomodoro-focus)/0.07)]',
        border: 'border-[hsl(var(--color-pomodoro-focus)/0.24)]',
        button:
          'bg-[hsl(var(--color-pomodoro-focus))] text-white hover:bg-[hsl(var(--color-pomodoro-focus)/0.9)]',
      }
    case 'shortBreak':
      return {
        text: 'text-[hsl(var(--color-pomodoro-short-break))]',
        surface: 'bg-[hsl(var(--color-pomodoro-short-break)/0.07)]',
        border: 'border-[hsl(var(--color-pomodoro-short-break)/0.24)]',
        button:
          'bg-[hsl(var(--color-pomodoro-short-break))] text-white hover:bg-[hsl(var(--color-pomodoro-short-break)/0.9)]',
      }
    case 'longBreak':
      return {
        text: 'text-[hsl(var(--color-pomodoro-long-break))]',
        surface: 'bg-[hsl(var(--color-pomodoro-long-break)/0.07)]',
        border: 'border-[hsl(var(--color-pomodoro-long-break)/0.24)]',
        button:
          'bg-[hsl(var(--color-pomodoro-long-break))] text-white hover:bg-[hsl(var(--color-pomodoro-long-break)/0.9)]',
      }
  }
}

const PomodoroFocusView: React.FC = () => {
  const router = useRouter()
  const { state } = useTaskManager()
  const { user } = useUser()
  const {
    startTimer,
    pauseTimer,
    resetTimer,
    skipBreak,
    setFocusedTask,
    setFocusedHabit,
  } = usePomodoroActions()
  const { t } = useI18n()
  const { pomodoro } = state

  const [isTaskPickerOpen, setTaskPickerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'task' | 'habit'>('task')
  const [searchTerm, setSearchTerm] = useState('')
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('today')
  const [selectedListId, setSelectedListId] = useState<string | 'inbox'>('inbox')
  const [isStatisticsOpen, setStatisticsOpen] = useState(false)
  const [statisticsTab, setStatisticsTab] = useState<StatisticsTab>('overview')

  const focusedTask = useMemo(
    () => state.tasks.find((task) => task.id === pomodoro.focusedTaskId),
    [state.tasks, pomodoro.focusedTaskId],
  )

  const focusedHabit = useMemo(
    () => state.habits.find((habit) => habit.id === pomodoro.focusedHabitId),
    [state.habits, pomodoro.focusedHabitId],
  )

  const inboxListId = useMemo(
    () => state.lists.find((list) => list.name === 'Inbox' || list.id === 'inbox')?.id ?? 'inbox',
    [state.lists],
  )

  const focusedLabel = focusedTask?.title ?? focusedHabit?.name ?? null
  const focusedKind = focusedTask
    ? t('focusPicker.taskTab')
    : focusedHabit
      ? t('focusPicker.habitTab')
      : null

  const totalDuration =
    pomodoro.settings[
      pomodoro.currentSession === 'focus'
        ? 'focusDuration'
        : pomodoro.currentSession === 'shortBreak'
          ? 'shortBreakDuration'
          : 'longBreakDuration'
    ] * 60

  const progress = Math.min(
    1,
    Math.max(0, totalDuration > 0 ? (totalDuration - pomodoro.remainingTime) / totalDuration : 0),
  )
  const hasProgress = pomodoro.remainingTime < totalDuration
  const isTimerEngaged = pomodoro.isActive || pomodoro.isPaused || hasProgress
  const visuals = sessionVisuals(pomodoro.currentSession)

  const cycleLength = Math.max(1, pomodoro.settings.sessionsUntilLongBreak)
  const completedInCycle = pomodoro.sessionsCompleted % cycleLength
  const currentFocusOrdinal = Math.min(completedInCycle + 1, cycleLength)

  const today = toYYYYMMDD(new Date())
  const todaysFocusRecords = useMemo(
    () =>
      pomodoro.focusHistory.filter(
        (record) => toYYYYMMDD(new Date(record.startTime)) === today,
      ),
    [pomodoro.focusHistory, today],
  )
  const totalPomosToday = todaysFocusRecords.length
  const totalFocusDurationToday = todaysFocusRecords.reduce(
    (total, record) => total + record.duration,
    0,
  )
  const totalPomosAllTime = pomodoro.focusHistory.length
  const totalFocusDurationAllTime = pomodoro.focusHistory.reduce(
    (total, record) => total + record.duration,
    0,
  )

  const focusByTask = useMemo(() => {
    const totals = new Map<string, number>()
    for (const record of pomodoro.focusHistory) {
      if (!record.taskId) continue
      totals.set(record.taskId, (totals.get(record.taskId) ?? 0) + record.duration)
    }

    return Array.from(totals.entries())
      .map(([taskId, seconds]) => ({
        taskId,
        title:
          state.tasks.find((task) => task.id === taskId)?.title ?? t('pomodoro.generalFocus'),
        seconds,
      }))
      .sort((a, b) => b.seconds - a.seconds)
  }, [pomodoro.focusHistory, state.tasks, t])

  const recentFocusSessions = useMemo(
    () => [...pomodoro.focusHistory].reverse().slice(0, 20),
    [pomodoro.focusHistory],
  )

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${t('pomodoro.duration.hoursShort' as TranslationKey, { count: hours })} ${t(
        'pomodoro.duration.minutesShort' as TranslationKey,
        { count: minutes },
      )}`
    }

    return t('pomodoro.duration.minutesShort' as TranslationKey, { count: minutes })
  }

  const sessionName = (() => {
    switch (pomodoro.currentSession) {
      case 'focus':
        return t('pomodoro.focus')
      case 'shortBreak':
        return t('pomodoro.shortBreak')
      case 'longBreak':
        return t('pomodoro.longBreak')
    }
  })()

  const sessionIcon =
    pomodoro.currentSession === 'focus' ? (
      <FlagIcon className="h-4 w-4" />
    ) : (
      <SunIcon className="h-4 w-4" />
    )

  const primaryActionLabel = pomodoro.isActive && !pomodoro.isPaused
    ? t('pomodoro.pause')
    : pomodoro.isPaused
      ? t('pomodoro.resume')
      : t('pomodoro.start')

  const handlePrimaryAction = () => {
    if (pomodoro.isActive && !pomodoro.isPaused) {
      pauseTimer()
      return
    }
    startTimer()
  }

  const normalizeTaskForFilter = (task: Task) => {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null
    return dueDate ? toYYYYMMDD(dueDate) : null
  }

  const taskCandidates = useMemo(() => {
    const base = state.tasks.filter((task) => !task.completed)
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)

    const recentTaskIds = new Set(
      pomodoro.focusHistory
        .filter((session) => {
          if (!session.taskId) return false
          const start = new Date(session.startTime)
          return start >= sevenDaysAgo && start <= now
        })
        .map((session) => session.taskId as string),
    )

    const effectiveListId = selectedListId === 'inbox' ? inboxListId : selectedListId

    return base.filter((task) => {
      const dueDateStr = normalizeTaskForFilter(task)

      switch (taskFilter) {
        case 'today':
          return !dueDateStr || dueDateStr === today
        case 'tomorrow': {
          if (!dueDateStr) return false
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          return dueDateStr === toYYYYMMDD(tomorrow)
        }
        case 'next7Days': {
          if (!dueDateStr) return false
          const in7Days = new Date()
          in7Days.setDate(in7Days.getDate() + 7)
          return dueDateStr >= today && dueDateStr <= toYYYYMMDD(in7Days)
        }
        case 'recent':
          return recentTaskIds.has(task.id)
        case 'assignedToMe':
          return Boolean(user?.id) && task.assigneeId === user?.id
        case 'list':
          return task.listId === effectiveListId
      }
    })
  }, [
    inboxListId,
    pomodoro.focusHistory,
    selectedListId,
    state.tasks,
    taskFilter,
    today,
    user?.id,
  ])

  const filteredTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return taskCandidates.filter(
      (task) => !query || task.title.toLowerCase().includes(query),
    )
  }, [searchTerm, taskCandidates])

  const filteredHabits = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)

    const recentHabitIds = new Set(
      pomodoro.focusHistory
        .filter((session) => {
          if (!session.habitId) return false
          const start = new Date(session.startTime)
          return start >= sevenDaysAgo && start <= now
        })
        .map((session) => session.habitId as string),
    )

    return state.habits.filter((habit: Habit) => {
      if (taskFilter === 'recent' && !recentHabitIds.has(habit.id)) return false
      return !query || habit.name.toLowerCase().includes(query)
    })
  }, [pomodoro.focusHistory, searchTerm, state.habits, taskFilter])

  const selectGeneralFocus = () => {
    setFocusedTask(null)
    setFocusedHabit(null)
    setTaskPickerOpen(false)
  }

  const selectTask = (taskId: string) => {
    setFocusedHabit(null)
    setFocusedTask(taskId)
    setTaskPickerOpen(false)
  }

  const selectHabit = (habitId: string) => {
    setFocusedTask(null)
    setFocusedHabit(habitId)
    setTaskPickerOpen(false)
  }

  return (
    <AppPage>
      <AppPageHeader title={t('nav.pomodoro')} subtitle={t('pomodoro.subtitle')} />
      <AppPageMain className="py-4 md:py-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 md:gap-6">
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStatisticsOpen(true)}
              className="gap-2"
            >
              <StopwatchIcon className="h-4 w-4" />
              {t('pomodoro.overviewMenu.statistics' as TranslationKey)}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push('/settings')}
              className="gap-2"
            >
              <SettingsIcon className="h-4 w-4" />
              {t('nav.settings')}
            </Button>
          </div>

          <section
            className={`relative overflow-hidden rounded-3xl border ${visuals.border} ${visuals.surface} px-4 py-6 shadow-sm sm:px-8 sm:py-8 md:px-10 md:py-10`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-1/4 -top-24 h-48 rounded-full bg-current opacity-[0.04] blur-3xl"
            />

            <div className="relative flex flex-col items-center">
              <div className="mb-5 flex flex-col items-center gap-3 text-center">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border ${visuals.border} bg-background/70 px-3 py-1.5 text-sm font-semibold ${visuals.text}`}
                >
                  {sessionIcon}
                  <span>{sessionName}</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  {pomodoro.currentSession === 'focus' && (
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {t('pomodoro.session')} {currentFocusOrdinal} {t('pomodoro.of')} {cycleLength}
                    </p>
                  )}
                  <div className={`flex items-center gap-1.5 ${visuals.text}`} aria-hidden>
                    {Array.from({ length: cycleLength }, (_, index) => {
                      const completed = index < completedInCycle
                      const current =
                        pomodoro.currentSession === 'focus' && index === currentFocusOrdinal - 1
                      return (
                        <span
                          key={index}
                          className={`h-2 rounded-full transition-all duration-200 motion-reduce:transition-none ${
                            completed
                              ? 'w-5 bg-current'
                              : current
                                ? 'w-5 border border-current bg-current/20'
                                : 'w-2 border border-current/35 bg-transparent'
                          }`}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTaskPickerOpen(true)}
                className="group mb-6 flex w-full max-w-xl items-center gap-3 rounded-2xl border border-border/70 bg-background/75 px-4 py-3 text-left shadow-sm transition-[border-color,background-color,transform] duration-150 hover:border-primary/50 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none sm:px-5"
                aria-label={t('pomodoro.selectTask')}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${visuals.surface} ${visuals.text}`}
                >
                  {focusedHabit ? <SunIcon className="h-5 w-5" /> : <FlagIcon className="h-5 w-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  {focusedLabel ? (
                    <>
                      <span className="block text-xs font-medium text-muted-foreground">
                        {focusedKind}
                      </span>
                      <span className="block truncate text-sm font-semibold text-foreground sm:text-base">
                        {focusedLabel}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="block text-xs font-medium text-muted-foreground">
                        {t('pomodoro.generalFocus')}
                      </span>
                      <span className="block text-sm font-semibold text-foreground sm:text-base">
                        {t('pomodoro.selectTask')}
                      </span>
                    </>
                  )}
                </span>
                {focusedTask && focusedTask.priority !== 'none' && (
                  <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
                    {t(`priority.${focusedTask.priority}` as TranslationKey)}
                  </Badge>
                )}
              </button>

              <div className="relative mb-6 flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72 md:h-80 md:w-80">
                <svg className="absolute h-full w-full" viewBox="0 0 100 100" aria-hidden>
                  <circle
                    className="text-border/70"
                    strokeWidth="5"
                    stroke="currentColor"
                    fill="transparent"
                    r={TIMER_RADIUS}
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className={`${visuals.text} transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none`}
                    strokeWidth="5"
                    strokeDasharray={TIMER_CIRCUMFERENCE}
                    strokeDashoffset={TIMER_CIRCUMFERENCE * (1 - progress)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={TIMER_RADIUS}
                    cx="50"
                    cy="50"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                  />
                </svg>

                <div className="text-center">
                  <div
                    className="font-mono text-6xl font-semibold tracking-[-0.07em] text-foreground tabular-nums sm:text-7xl md:text-8xl"
                    aria-label={`${sessionName}: ${formatTime(pomodoro.remainingTime)}`}
                  >
                    {formatTime(pomodoro.remainingTime)}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t('pomodoro.percentComplete', { percent: Math.round(progress * 100) })}
                  </p>
                </div>
              </div>

              <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                <Button
                  type="button"
                  size="lg"
                  onClick={handlePrimaryAction}
                  className={`order-1 w-full gap-2 px-8 sm:w-auto ${visuals.button}`}
                >
                  {pomodoro.isActive && !pomodoro.isPaused ? (
                    <PauseIcon className="h-4 w-4" />
                  ) : (
                    <PlayCircleIcon className="h-4 w-4" />
                  )}
                  {primaryActionLabel}
                </Button>

                {isTimerEngaged && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={resetTimer}
                    className="order-2 w-full gap-2 sm:w-auto"
                  >
                    <SquareIcon className="h-4 w-4" />
                    {t('pomodoro.stop')}
                  </Button>
                )}

                {pomodoro.currentSession !== 'focus' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={skipBreak}
                    className="order-3 w-full sm:w-auto"
                  >
                    {t('pomodoro.skipBreak')}
                  </Button>
                )}
              </div>

              {!isTimerEngaged && (
                <div className="mt-7 grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3 text-center">
                    <p className="text-2xl font-semibold tabular-nums">{totalPomosToday}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t('pomodoro.todayPomos')}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/55 px-4 py-3 text-center">
                    <p className="text-2xl font-semibold tabular-nums">
                      {formatDuration(totalFocusDurationToday)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{t('pomodoro.focusTime')}</p>
                  </div>
                  <div className="col-span-2 rounded-2xl border border-border/60 bg-background/55 px-4 py-3 text-center sm:col-span-1">
                    <p className="text-2xl font-semibold tabular-nums">{cycleLength}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('pomodoro.longBreakAfter')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {isTaskPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-0 duration-150 motion-reduce:animate-none">
            <AccessibleModalSurface
              aria-label={t('focusPicker.title')}
              onClose={() => setTaskPickerOpen(false)}
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded-2xl border border-border bg-card shadow-xl animate-in zoom-in-95 duration-150 motion-reduce:animate-none"
            >
              <header className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
                <h2 className="text-lg font-semibold">{t('focusPicker.title')}</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setTaskPickerOpen(false)}
                >
                  {t('common.close')}
                </Button>
              </header>

              <div className="grow overflow-y-auto p-4 sm:p-5">
                <SegmentedControl
                  shape="pill"
                  size="sm"
                  fullWidth
                  aria-label={t('focusPicker.title')}
                  value={activeTab}
                  onValueChange={setActiveTab}
                  options={[
                    { value: 'task', label: t('focusPicker.taskTab') },
                    { value: 'habit', label: t('focusPicker.habitTab') },
                  ]}
                  className="mb-4"
                />

                <div className="mb-4 flex flex-col gap-3">
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder={t('focusPicker.searchPlaceholder' as TranslationKey)}
                      className="h-10 pl-9"
                    />
                  </div>

                  {activeTab === 'task' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="w-fit gap-2">
                          <CalendarDayIcon className="h-4 w-4" />
                          <span>
                            {taskFilter === 'today' && t('focusPicker.filters.today')}
                            {taskFilter === 'tomorrow' && t('focusPicker.filters.tomorrow')}
                            {taskFilter === 'next7Days' && t('focusPicker.filters.next7Days')}
                            {taskFilter === 'recent' &&
                              t('focusPicker.filters.recent' as TranslationKey)}
                            {taskFilter === 'assignedToMe' &&
                              t('focusPicker.filters.assignedToMe')}
                            {taskFilter === 'list' && t('focusPicker.filters.lists')}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {(
                          [
                            ['today', 'focusPicker.filters.today'],
                            ['tomorrow', 'focusPicker.filters.tomorrow'],
                            ['next7Days', 'focusPicker.filters.next7Days'],
                            ['recent', 'focusPicker.filters.recent'],
                            ['assignedToMe', 'focusPicker.filters.assignedToMe'],
                          ] as const
                        ).map(([value, label]) => (
                          <DropdownMenuItem key={value} onClick={() => setTaskFilter(value)}>
                            {t(label as TranslationKey)}
                            {taskFilter === value && (
                              <CheckCircleIcon className="ml-auto h-4 w-4 text-primary" />
                            )}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                          {t('focusPicker.filters.lists')}
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedListId('inbox')
                            setTaskFilter('list')
                          }}
                        >
                          <InboxIcon className="mr-2 h-4 w-4" />
                          {t('specialLists.inbox')}
                          {taskFilter === 'list' && selectedListId === 'inbox' && (
                            <CheckCircleIcon className="ml-auto h-4 w-4 text-primary" />
                          )}
                        </DropdownMenuItem>
                        {state.lists
                          .filter(
                            (list) => list.id !== inboxListId && list.name !== 'Inbox',
                          )
                          .map((list) => (
                            <DropdownMenuItem
                              key={list.id}
                              onClick={() => {
                                setSelectedListId(list.id)
                                setTaskFilter('list')
                              }}
                            >
                              <span
                                aria-hidden
                                className="mr-2 h-2 w-2 rounded-full"
                                style={{ backgroundColor: list.color }}
                              />
                              <span>{list.name}</span>
                              {taskFilter === 'list' && selectedListId === list.id && (
                                <CheckCircleIcon className="ml-auto h-4 w-4 text-primary" />
                              )}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <ul className="space-y-2">
                  <li>
                    <button
                      type="button"
                      onClick={selectGeneralFocus}
                      className={`flex min-h-12 w-full items-center justify-between rounded-xl border p-3 text-left transition-colors motion-reduce:transition-none ${
                        !pomodoro.focusedTaskId && !pomodoro.focusedHabitId
                          ? 'border-primary bg-primary/5'
                          : 'border-border/60 hover:bg-secondary/70'
                      }`}
                    >
                      <span className="font-medium">{t('focusPicker.general')}</span>
                      {!pomodoro.focusedTaskId && !pomodoro.focusedHabitId && (
                        <CheckCircleIcon className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  </li>

                  {activeTab === 'task'
                    ? filteredTasks.map((task) => (
                        <li key={task.id}>
                          <button
                            type="button"
                            onClick={() => selectTask(task.id)}
                            className={`flex min-h-12 w-full items-center justify-between rounded-xl border p-3 text-left transition-colors motion-reduce:transition-none ${
                              pomodoro.focusedTaskId === task.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border/60 hover:bg-secondary/70'
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              {task.listId === inboxListId && (
                                <InboxIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                              )}
                              <span className="truncate">{task.title}</span>
                            </span>
                            {pomodoro.focusedTaskId === task.id && (
                              <CheckCircleIcon className="ml-3 h-5 w-5 shrink-0 text-primary" />
                            )}
                          </button>
                        </li>
                      ))
                    : filteredHabits.map((habit) => (
                        <li key={habit.id}>
                          <button
                            type="button"
                            onClick={() => selectHabit(habit.id)}
                            className={`flex min-h-12 w-full items-center justify-between rounded-xl border p-3 text-left transition-colors motion-reduce:transition-none ${
                              pomodoro.focusedHabitId === habit.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border/60 hover:bg-secondary/70'
                            }`}
                          >
                            <span className="truncate">{habit.name}</span>
                            {pomodoro.focusedHabitId === habit.id && (
                              <CheckCircleIcon className="ml-3 h-5 w-5 shrink-0 text-primary" />
                            )}
                          </button>
                        </li>
                      ))}
                </ul>
              </div>
            </AccessibleModalSurface>
          </div>
        )}

        {isStatisticsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm animate-in fade-in-0 duration-150 motion-reduce:animate-none">
            <AccessibleModalSurface
              aria-label={t('pomodoro.statisticsTitle' as TranslationKey)}
              onClose={() => setStatisticsOpen(false)}
              className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-xl animate-in zoom-in-95 duration-150 motion-reduce:animate-none"
            >
              <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <StopwatchIcon className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">
                    {t('pomodoro.statisticsTitle' as TranslationKey)}
                  </h2>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setStatisticsOpen(false)}>
                  {t('shareList.done')}
                </Button>
              </header>

              <div className="space-y-6 overflow-y-auto px-5 pb-6 pt-4 sm:px-6">
                <SegmentedControl
                  shape="pill"
                  size="sm"
                  aria-label={t('pomodoro.statisticsTitle' as TranslationKey)}
                  value={statisticsTab}
                  onValueChange={setStatisticsTab}
                  options={[
                    {
                      value: 'overview',
                      label: t('pomodoro.statisticsOverviewTab' as TranslationKey),
                    },
                    {
                      value: 'task',
                      label: t('pomodoro.statisticsTaskTab' as TranslationKey),
                    },
                    {
                      value: 'focus',
                      label: t('pomodoro.statisticsFocusTab' as TranslationKey),
                    },
                  ]}
                />

                {statisticsTab === 'overview' && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      variant="muted"
                      label={t('pomodoro.todayPomos')}
                      value={totalPomosToday}
                    />
                    <StatCard
                      variant="muted"
                      label={t('pomodoro.focusTime')}
                      value={formatDuration(totalFocusDurationToday)}
                    />
                    <StatCard
                      variant="muted"
                      label={t('pomodoro.totalSessionsLabel')}
                      value={totalPomosAllTime}
                    />
                    <StatCard
                      variant="muted"
                      label={t('pomodoro.allTimeFocus')}
                      value={formatDuration(totalFocusDurationAllTime)}
                    />
                  </div>
                )}

                {statisticsTab === 'task' &&
                  (focusByTask.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('pomodoro.statisticsEmpty' as TranslationKey)}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {focusByTask.map((entry) => (
                        <div
                          key={entry.taskId}
                          className="flex items-center justify-between rounded-xl border border-border/60 p-3"
                        >
                          <span className="truncate text-sm font-medium">{entry.title}</span>
                          <span className="ml-3 shrink-0 text-sm text-muted-foreground">
                            {formatDuration(entry.seconds)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}

                {statisticsTab === 'focus' &&
                  (recentFocusSessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('pomodoro.statisticsEmpty' as TranslationKey)}
                    </p>
                  ) : (
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {recentFocusSessions.map((record, index) => {
                        const task = record.taskId
                          ? state.tasks.find((item) => item.id === record.taskId)
                          : null
                        const habit = record.habitId
                          ? state.habits.find((item) => item.id === record.habitId)
                          : null
                        const label = task?.title ?? habit?.name ?? t('pomodoro.generalFocus')

                        return (
                          <div
                            key={`${record.startTime}-${index}`}
                            className="flex items-center justify-between rounded-xl border border-border/60 p-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{label}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(record.startTime).toLocaleString()}
                              </p>
                            </div>
                            <span className="ml-3 shrink-0 text-sm text-muted-foreground">
                              {formatDuration(record.duration)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ))}
              </div>
            </AccessibleModalSurface>
          </div>
        )}
      </AppPageMain>
    </AppPage>
  )
}

export default PomodoroFocusView
