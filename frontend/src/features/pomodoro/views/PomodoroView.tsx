"use client"

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { usePomodoroActions } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { useUser } from '@/components/providers/user-provider'
import { CheckCircleIcon, PlayCircleIcon, CloseIcon, StopwatchIcon, FlagIcon, SunIcon, SearchIcon, CalendarDayIcon, InboxIcon } from '@/lib/icons'
import { toYYYYMMDD } from '@/lib/utils/date-helpers'
import { AppPage, AppPageMain } from '@/components/layout/app-page'
import { AppPageHeader } from '@/components/layout/app-page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { StatCard } from '@/components/ui/stat-card'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Task, Habit } from '@/types'
import type { TranslationKey } from '@/lib/i18n/types'

function PomodoroOverflowMenu({
  onOpenStatistics,
  t,
  onOpenSettings,
}: {
  onOpenStatistics: () => void
  t: (key: TranslationKey, options?: Record<string, string | number>) => string
  onOpenSettings: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted/80 text-muted-foreground hover:bg-muted border border-border/60"
        >
          <span className="text-lg leading-none">⋯</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onOpenStatistics}>
          {t('pomodoro.overviewMenu.statistics' as TranslationKey)}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenSettings}>
          {t('nav.settings' as TranslationKey)}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const PomodoroView: React.FC = () => {
  const router = useRouter()
  const { state } = useTaskManager()
  const { user } = useUser()
  const { startTimer, pauseTimer, resetTimer, skipBreak, setFocusedTask, setFocusedHabit } = usePomodoroActions()
  const { t } = useI18n()
  const { pomodoro } = state
  const [isTaskPickerOpen, setTaskPickerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'task' | 'habit'>('task')
  const [searchTerm, setSearchTerm] = useState('')
  const [taskFilter, setTaskFilter] = useState<'today' | 'tomorrow' | 'next7Days' | 'recent' | 'assignedToMe' | 'list'>('today')
  const [selectedListId, setSelectedListId] = useState<string | 'inbox'>('inbox')
  const [isStatisticsOpen, setStatisticsOpen] = useState(false)
  const [statisticsTab, setStatisticsTab] = useState<'overview' | 'task' | 'focus'>('overview')

  const focusedTask = useMemo(
    () => state.tasks.find(t => t.id === pomodoro.focusedTaskId),
    [state.tasks, pomodoro.focusedTaskId]
  )

  const focusedHabit = useMemo(
    () => state.habits.find(h => h.id === pomodoro.focusedHabitId),
    [state.habits, pomodoro.focusedHabitId]
  )

  const today = toYYYYMMDD(new Date())
  const todaysFocusRecords = pomodoro.focusHistory.filter(r => r.startTime.startsWith(today))
  const totalPomosToday = todaysFocusRecords.length
  const totalFocusDurationToday = todaysFocusRecords.reduce((acc, curr) => acc + curr.duration, 0)
  const totalPomosAllTime = pomodoro.sessionsCompleted
  const totalFocusDurationAllTime = pomodoro.focusHistory.reduce((acc, curr) => acc + curr.duration, 0)

  const focusByTask = useMemo(() => {
    const totals = new Map<string, number>()
    for (const record of pomodoro.focusHistory) {
      if (!record.taskId) continue
      totals.set(record.taskId, (totals.get(record.taskId) ?? 0) + record.duration)
    }
    return Array.from(totals.entries())
      .map(([taskId, seconds]) => ({
        taskId,
        title: state.tasks.find(task => task.id === taskId)?.title ?? t('pomodoro.generalFocus'),
        seconds,
      }))
      .sort((a, b) => b.seconds - a.seconds)
  }, [pomodoro.focusHistory, state.tasks, t])

  const recentFocusSessions = useMemo(
    () => [...pomodoro.focusHistory].reverse().slice(0, 20),
    [pomodoro.focusHistory],
  )

  const openPomodoroSettings = () => router.push('/settings')

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      const hoursLabel = t('pomodoro.duration.hoursShort' as TranslationKey, { count: hours })
      const minutesLabel = t('pomodoro.duration.minutesShort' as TranslationKey, { count: minutes })
      return `${hoursLabel} ${minutesLabel}`
    }

    return t('pomodoro.duration.minutesShort' as TranslationKey, { count: minutes })
  }

  const handlePauseResume = () => {
    if (pomodoro.isPaused || !pomodoro.isActive) {
      startTimer()
    } else {
      pauseTimer()
    }
  }

  const handleStop = () => {
    resetTimer()
  }

  const getSessionName = () => {
    switch (pomodoro.currentSession) {
      case 'focus': return t('pomodoro.focus')
      case 'shortBreak': return t('pomodoro.shortBreak')
      case 'longBreak': return t('pomodoro.longBreak')
    }
  }

  const getSessionIcon = () => {
    switch (pomodoro.currentSession) {
      case 'focus': return <FlagIcon className="h-5 w-5" />
      case 'shortBreak': return <SunIcon className="h-5 w-5" />
      case 'longBreak': return <SunIcon className="h-5 w-5" />
    }
  }

  const getSessionColor = () => {
    switch (pomodoro.currentSession) {
      case 'focus': return 'text-[hsl(var(--color-pomodoro-focus))]'
      case 'shortBreak': return 'text-[hsl(var(--color-pomodoro-short-break))]'
      case 'longBreak': return 'text-[hsl(var(--color-pomodoro-long-break))]'
    }
  }

  const totalDuration = pomodoro.settings[
    pomodoro.currentSession === 'focus' ? 'focusDuration' :
    pomodoro.currentSession === 'shortBreak' ? 'shortBreakDuration' : 'longBreakDuration'
  ] * 60
  const progress = totalDuration > 0 ? (totalDuration - pomodoro.remainingTime) / totalDuration : 0

  const todayDateStr = toYYYYMMDD(new Date())

  const normalizeTaskForFilter = (task: Task) => {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null
    const dueDateStr = dueDate ? toYYYYMMDD(dueDate) : null
    return { dueDate, dueDateStr }
  }

  const taskCandidates = useMemo(() => {
    const base = state.tasks.filter(task => !task.completed)

    const now = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(now.getDate() - 7)

    const recentTaskIds = new Set(
      pomodoro.focusHistory
        .filter(session => {
          if (!session.taskId) return false
          const start = new Date(session.startTime)
          return start >= sevenDaysAgo && start <= now
        })
        .map(session => session.taskId as string)
    )

    return base.filter(task => {
      const { dueDateStr } = normalizeTaskForFilter(task)

      switch (taskFilter) {
        case 'today':
          return !dueDateStr || dueDateStr === todayDateStr
        case 'tomorrow': {
          if (!dueDateStr) return false
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          return dueDateStr === toYYYYMMDD(tomorrow)
        }
        case 'next7Days': {
          if (!dueDateStr) return false
          const todayStart = todayDateStr
          const in7 = new Date()
          in7.setDate(in7.getDate() + 7)
          const in7Str = toYYYYMMDD(in7)
          return dueDateStr >= todayStart && dueDateStr <= in7Str
        }
        case 'recent':
          return recentTaskIds.has(task.id)
        case 'assignedToMe':
          return !!user?.id && task.assigneeId === user.id
        case 'list':
          return task.listId === selectedListId
        default:
          return true
      }
    })
  }, [state.tasks, taskFilter, selectedListId, todayDateStr, pomodoro.focusHistory, user])

  const filteredTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return taskCandidates.filter(task =>
      !query || task.title.toLowerCase().includes(query)
    )
  }, [taskCandidates, searchTerm])

  const filteredHabits = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    const now = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(now.getDate() - 7)

    const recentHabitIds = new Set(
      pomodoro.focusHistory
        .filter(session => {
          if (!session.habitId) return false
          const start = new Date(session.startTime)
          return start >= sevenDaysAgo && start <= now
        })
        .map(session => session.habitId as string)
    )

    return state.habits.filter((habit: Habit) => {
      if (taskFilter === 'recent' && !recentHabitIds.has(habit.id)) {
        return false
      }

      const matchesQuery = !query || habit.name.toLowerCase().includes(query)
      return matchesQuery
    })
  }, [state.habits, searchTerm, pomodoro.focusHistory, taskFilter])

  return (
    <AppPage>
      <AppPageHeader
        title={t('nav.pomodoro')}
        subtitle={t('pomodoro.subtitle')}
      />
      <AppPageMain className="py-4 md:py-6">
        <div className="mb-4 flex justify-end lg:hidden">
          <PomodoroOverflowMenu
            onOpenStatistics={() => setStatisticsOpen(true)}
            onOpenSettings={openPomodoroSettings}
            t={t}
          />
        </div>

        <div className="flex flex-col lg:flex-row h-full gap-8">
          <div className="flex-1 flex flex-col items-center justify-center lg:justify-start">
            <div className="hidden lg:flex w-full justify-end mb-4">
              <PomodoroOverflowMenu
                onOpenStatistics={() => setStatisticsOpen(true)}
                onOpenSettings={openPomodoroSettings}
                t={t}
              />
            </div>

            <div className="text-center mb-8">
              <div className={`flex items-center justify-center gap-2 mb-3 ${getSessionColor()}`}>
                {getSessionIcon()}
                <p className="text-xl font-semibold">
                  {getSessionName()}
                </p>
              </div>
              <div 
                className={`text-lg md:text-xl font-medium min-h-8 cursor-pointer p-3 rounded-lg transition-colors border ${
                  focusedTask || focusedHabit
                    ? 'border-primary/60 bg-secondary'
                    : 'border-border/50 bg-secondary'
                }`}
                onClick={() => setTaskPickerOpen(true)}
              >
                {focusedTask || focusedHabit
                  ? t('pomodoro.focusingOn', {
                      taskTitle: focusedTask?.title ?? focusedHabit?.name ?? '',
                    })
                  : t('pomodoro.selectTask')}
              </div>
              {focusedTask && (
                <Badge variant="secondary" className="mt-2">
                  {focusedTask.priority === 'high' && t('pomodoro.highPriorityLabel')}
                  {focusedTask.priority === 'medium' && t('pomodoro.mediumPriorityLabel')}
                  {focusedTask.priority === 'low' && t('pomodoro.lowPriorityLabel')}
                </Badge>
              )}
            </div>

            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-8">
              <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                <circle 
                  className="text-secondary/20" 
                  strokeWidth="8" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="45" 
                  cx="50" 
                  cy="50" 
                />
                <circle
                  className={`${getSessionColor()} transition-all duration-1000 ease-linear`}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                />
              </svg>
              <div className="text-center">
                <span className="text-6xl md:text-7xl font-bold font-mono tracking-tighter">
                  {formatTime(pomodoro.remainingTime)}
                </span>
                <div className="text-sm text-muted-foreground mt-2">
                  {t('pomodoro.percentComplete', { percent: Math.round(progress * 100) })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                variant="outline"
                size="lg"
                onClick={handleStop}
                className="flex items-center gap-2"
              >
                <CloseIcon className="h-4 w-4" />
                {t('pomodoro.stop')}
              </Button>

              {pomodoro.currentSession !== 'focus' && (
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={skipBreak}
                  className="flex items-center gap-2"
                >
                  {t('pomodoro.skipBreak')}
                </Button>
              )}

              <Button 
                size="lg"
                onClick={handlePauseResume}
                className={`flex items-center gap-2 px-8 ${
                  pomodoro.currentSession === 'focus' 
                    ? 'bg-[hsl(var(--color-pomodoro-focus))] hover:bg-[hsl(var(--color-pomodoro-focus) / 0.9)] text-white' 
                    : pomodoro.currentSession === 'shortBreak'
                    ? 'bg-[hsl(var(--color-pomodoro-short-break))] hover:bg-[hsl(var(--color-pomodoro-short-break) / 0.9)] text-white'
                    : 'bg-[hsl(var(--color-pomodoro-long-break))] hover:bg-[hsl(var(--color-pomodoro-long-break) / 0.9)] text-white'
                }`}
              >
                {pomodoro.isPaused || !pomodoro.isActive ? (
                  <>
                    <PlayCircleIcon className="h-4 w-4" />
                    {t('pomodoro.start')}
                  </>
                ) : (
                  <>
                    <CloseIcon className="h-4 w-4" />
                    {t('pomodoro.pause')}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="w-full lg:w-96 space-y-6">
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StopwatchIcon className="h-5 w-5" />
                    {t('pomodoro.overviewTitle' as TranslationKey)}
                  </CardTitle>
                  <CardDescription>
                    {t('pomodoro.todaySubtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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

                  {todaysFocusRecords.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">{t('pomodoro.recentSessions')}</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {todaysFocusRecords.slice(-3).reverse().map((record, index) => {
                          const task = state.tasks.find(t => t.id === record.taskId)
                          return (
                            <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                              <span className="truncate">
                                {task?.title || t('pomodoro.generalFocus')}
                              </span>
                              <span className="text-muted-foreground">
                                {formatDuration(record.duration)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('pomodoro.settings')}</CardTitle>
                <CardDescription>
                  {t('pomodoro.configTitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-[hsl(var(--color-pomodoro-focus) / 0.1)] rounded-lg">
                  <div className="flex items-center gap-2">
                    <FlagIcon className="h-4 w-4 text-[hsl(var(--color-pomodoro-focus))]" />
                    <span className="font-medium">{t('pomodoro.focus')}</span>
                  </div>
                  <Badge variant="secondary">
                    {pomodoro.settings.focusDuration} {t('taskDetail.minutes')}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-[hsl(var(--color-pomodoro-short-break) / 0.1)] rounded-lg">
                  <div className="flex items-center gap-2">
                    <SunIcon className="h-4 w-4 text-[hsl(var(--color-pomodoro-short-break))]" />
                    <span className="font-medium">{t('pomodoro.shortBreak')}</span>
                  </div>
                  <Badge variant="secondary">
                    {pomodoro.settings.shortBreakDuration} {t('taskDetail.minutes')}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-[hsl(var(--color-pomodoro-long-break) / 0.1)] rounded-lg">
                  <div className="flex items-center gap-2">
                    <SunIcon className="h-4 w-4 text-[hsl(var(--color-pomodoro-long-break))]" />
                    <span className="font-medium">{t('pomodoro.longBreak')}</span>
                  </div>
                  <Badge variant="secondary">
                    {pomodoro.settings.longBreakDuration} {t('taskDetail.minutes')}
                  </Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t('pomodoro.longBreakAfter')}</span>
                    <span className="font-medium">{pomodoro.settings.sessionsUntilLongBreak} {t('pomodoro.sessionsLabel')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {isTaskPickerOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[70vh]">
              <header className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{t('focusPicker.title')}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setTaskPickerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-secondary transition-colors"
                  aria-label={t('common.close')}
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </header>
              <div className="grow p-4 overflow-y-auto">
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
                  className="mb-3"
                />

                <div className="mb-4 flex flex-col gap-3">
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('focusPicker.searchPlaceholder' as TranslationKey)}
                      className="h-9 pl-8"
                    />
                  </div>

                  {activeTab === 'task' && (
                    <div className="flex items-center justify-between">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium border border-border/60 bg-secondary data-[state=open]:border-primary data-[state=open]:ring-1 data-[state=open]:ring-primary/40"
                          >
                            <CalendarDayIcon className="h-4 w-4" />
                            <span>
                              {taskFilter === 'today' && t('focusPicker.filters.today')}
                              {taskFilter === 'tomorrow' && t('focusPicker.filters.tomorrow')}
                              {taskFilter === 'next7Days' && t('focusPicker.filters.next7Days')}
                              {taskFilter === 'recent' && t('focusPicker.filters.recent' as TranslationKey)}
                              {taskFilter === 'assignedToMe' && t('focusPicker.filters.assignedToMe')}
                              {taskFilter === 'list' && t('focusPicker.filters.lists')}
                            </span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 bg-card">
                          <DropdownMenuItem
                            onClick={() => setTaskFilter('today')}
                            className={
                              taskFilter === 'today'
                                ? 'bg-secondary text-foreground border border-primary/60'
                                : ''
                            }
                          >
                            {t('focusPicker.filters.today')}
                            {taskFilter === 'today' && (
                              <CheckCircleIcon className="ml-auto h-4 w-4 text-primary" />
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setTaskFilter('tomorrow')}
                            className={
                              taskFilter === 'tomorrow'
                                ? 'bg-secondary text-foreground border border-primary/60'
                                : ''
                            }
                          >
                            {t('focusPicker.filters.tomorrow')}
                            {taskFilter === 'tomorrow' && (
                              <CheckCircleIcon className="ml-auto h-4 w-4 text-primary" />
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setTaskFilter('next7Days')}
                            className={
                              taskFilter === 'next7Days'
                                ? 'bg-secondary text-foreground border border-primary/60'
                                : ''
                            }
                          >
                            {t('focusPicker.filters.next7Days')}
                            {taskFilter === 'next7Days' && (
                              <CheckCircleIcon className="ml-auto h-4 w-4 text-primary" />
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setTaskFilter('recent')}
                            className={
                              taskFilter === 'recent'
                                ? 'bg-secondary text-foreground border border-primary/60'
                                : ''
                            }
                          >
                            {t('focusPicker.filters.recent' as TranslationKey)}
                            {taskFilter === 'recent' && (
                              <CheckCircleIcon className="ml-auto h-4 w-4 text-primary" />
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setTaskFilter('assignedToMe')}
                            className={
                              taskFilter === 'assignedToMe'
                                ? 'bg-secondary text-foreground border border-primary/60'
                                : ''
                            }
                          >
                            {t('focusPicker.filters.assignedToMe')}
                            {taskFilter === 'assignedToMe' && (
                              <CheckCircleIcon className="ml-auto h-4 w-4 text-primary" />
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            {t('focusPicker.filters.lists')}
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedListId('inbox')
                              setTaskFilter('list')
                            }}
                            className={
                              taskFilter === 'list' && selectedListId === 'inbox'
                                ? 'bg-secondary text-foreground border border-primary/60'
                                : ''
                            }
                          >
                            <InboxIcon className="mr-2 h-4 w-4" />
                            <span>{t('specialLists.inbox')}</span>
                            {taskFilter === 'list' && selectedListId === 'inbox' && (
                              <CheckCircleIcon className="ml-auto h-4 w-4 text-primary" />
                            )}
                          </DropdownMenuItem>
                          {state.lists
                            .filter(list => list.id !== 'inbox')
                            .map(list => (
                              <DropdownMenuItem
                                key={list.id}
                                onClick={() => {
                                  setSelectedListId(list.id)
                                  setTaskFilter('list')
                                }}
                                className={
                                  taskFilter === 'list' && selectedListId === list.id
                                    ? 'bg-secondary text-foreground border border-primary/60'
                                    : ''
                                }
                              >
                                <span
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
                    </div>
                  )}
                </div>

                <ul className="space-y-2">
                  <li
                    onClick={() => {
                      setFocusedTask(null)
                      setFocusedHabit(null)
                      setTaskPickerOpen(false)
                    }}
                    className={`p-3 flex items-center justify-between rounded-md cursor-pointer hover:bg-secondary ${
                      !pomodoro.focusedTaskId && !pomodoro.focusedHabitId
                        ? 'bg-secondary border-2 border-primary'
                        : ''
                    }`}
                  >
                    <span>{t('focusPicker.general')}</span>
                    {!pomodoro.focusedTaskId && !pomodoro.focusedHabitId && (
                      <CheckCircleIcon className="h-5 w-5 text-primary" />
                    )}
                  </li>

                  {activeTab === 'task'
                    ? filteredTasks.map(task => (
                        <li
                          key={task.id}
                          onClick={() => {
                            setFocusedTask(task.id)
                            setTaskPickerOpen(false)
                          }}
                          className={`p-3 flex items-center justify-between rounded-md cursor-pointer hover:bg-secondary ${
                            pomodoro.focusedTaskId === task.id
                              ? 'bg-secondary border-2 border-primary'
                              : ''
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {task.listId === 'inbox' && <InboxIcon className="h-4 w-4 text-muted-foreground" />}
                            <span>{task.title}</span>
                          </span>
                          {pomodoro.focusedTaskId === task.id && (
                            <CheckCircleIcon className="h-5 w-5 text-primary" />
                          )}
                        </li>
                      ))
                    : filteredHabits.map(habit => (
                        <li
                          key={habit.id}
                          onClick={() => {
                            setFocusedHabit(habit.id)
                            setTaskPickerOpen(false)
                          }}
                          className={`p-3 flex items-center justify-between rounded-md cursor-pointer hover:bg-secondary ${
                            pomodoro.focusedHabitId === habit.id
                              ? 'bg-secondary border-2 border-primary'
                              : ''
                          }`}
                        >
                          <span>{habit.name}</span>
                          {pomodoro.focusedHabitId === habit.id && (
                            <CheckCircleIcon className="h-5 w-5 text-primary" />
                          )}
                        </li>
                      ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {isStatisticsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-5xl max-h-[90vh] bg-card text-card-foreground border border-border rounded-2xl shadow-xl flex flex-col">
              <header className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold">{t('pomodoro.statisticsTitle' as TranslationKey)}</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatisticsOpen(false)}
                >
                  {t('shareList.done')}
                </Button>
              </header>
              <div className="px-6 pt-4 pb-6 space-y-6 overflow-y-auto">
                <SegmentedControl
                  shape="pill"
                  size="sm"
                  aria-label={t('pomodoro.statisticsTitle' as TranslationKey)}
                  value={statisticsTab}
                  onValueChange={setStatisticsTab}
                  options={[
                    { value: 'overview', label: t('pomodoro.statisticsOverviewTab' as TranslationKey) },
                    { value: 'task', label: t('pomodoro.statisticsTaskTab' as TranslationKey) },
                    { value: 'focus', label: t('pomodoro.statisticsFocusTab' as TranslationKey) },
                  ]}
                />

                {statisticsTab === 'overview' && (
                  <div className="grid gap-4 md:grid-cols-4">
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

                {statisticsTab === 'task' && (
                  focusByTask.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('pomodoro.statisticsEmpty' as TranslationKey)}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {focusByTask.map(entry => (
                        <div
                          key={entry.taskId}
                          className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                        >
                          <span className="truncate text-sm font-medium">{entry.title}</span>
                          <span className="text-sm text-muted-foreground">{formatDuration(entry.seconds)}</span>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {statisticsTab === 'focus' && (
                  recentFocusSessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('pomodoro.statisticsEmpty' as TranslationKey)}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {recentFocusSessions.map((record, index) => {
                        const task = record.taskId
                          ? state.tasks.find(item => item.id === record.taskId)
                          : null
                        const habit = record.habitId
                          ? state.habits.find(item => item.id === record.habitId)
                          : null
                        const label = task?.title ?? habit?.name ?? t('pomodoro.generalFocus')
                        return (
                          <div
                            key={`${record.startTime}-${index}`}
                            className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{label}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(record.startTime).toLocaleString()}
                              </p>
                            </div>
                            <span className="text-sm text-muted-foreground">{formatDuration(record.duration)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </AppPageMain>
    </AppPage>
  )
}

export default PomodoroView

