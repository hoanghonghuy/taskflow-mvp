'use client'

import React, { useState, useMemo } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { usePomodoroActions } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { usePomodoroNotifications } from '@/lib/hooks/use-pomodoro-notifications'
import { CheckCircleIcon, PlayCircleIcon, CloseIcon, StopwatchIcon, FlagIcon, SunIcon } from '@/lib/constants'
import { toYYYYMMDD } from '@/lib/utils/date-helpers'
import { AppPage, AppPageContainer, AppPageMain } from '@/components/layout/app-page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const PomodoroView: React.FC = () => {
  const { state } = useTaskManager()
  const { startTimer, pauseTimer, resetTimer, skipBreak, setFocusedTask } = usePomodoroActions()
  const { t } = useI18n()
  const { pomodoro } = state
  const [isTaskPickerOpen, setTaskPickerOpen] = useState(false)
  
  // Enable session completion notifications
  usePomodoroNotifications()

  const focusedTask = useMemo(() => 
    state.tasks.find(t => t.id === pomodoro.focusedTaskId),
    [state.tasks, pomodoro.focusedTaskId]
  )

  const today = toYYYYMMDD(new Date())
  const todaysFocusRecords = pomodoro.focusHistory.filter(r => r.startTime.startsWith(today))
  const totalPomosToday = todaysFocusRecords.length
  const totalFocusDurationToday = todaysFocusRecords.reduce((acc, curr) => acc + curr.duration, 0)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
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
      case 'focus': return 'text-red-500'
      case 'shortBreak': return 'text-green-500'
      case 'longBreak': return 'text-blue-500'
    }
  }

  const totalDuration = pomodoro.settings[
    pomodoro.currentSession === 'focus' ? 'focusDuration' :
    pomodoro.currentSession === 'shortBreak' ? 'shortBreakDuration' : 'longBreakDuration'
  ] * 60
  const progress = totalDuration > 0 ? (totalDuration - pomodoro.remainingTime) / totalDuration : 0

  const uncompletedTasks = useMemo(() => {
    return state.tasks.filter(task => !task.completed)
  }, [state.tasks])

  return (
    <AppPage>
      <AppPageContainer>
        <header className="py-6 border-b border-border shrink-0 hidden md:block">
          <h1 className="text-3xl font-bold">{t('nav.pomodoro')}</h1>
          <p className="text-muted-foreground">{t('pomodoro.subtitle')}</p>
        </header>
      </AppPageContainer>
      <AppPageMain className="py-4 md:py-8">
        <div className="flex flex-col lg:flex-row h-full gap-8">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center mb-8">
              <div className={`flex items-center justify-center gap-2 mb-3 ${getSessionColor()}`}>
                {getSessionIcon()}
                <p className="text-xl font-semibold">
                  {getSessionName()}
                </p>
              </div>
              <div 
                className="text-lg md:text-xl font-medium min-h-8 cursor-pointer hover:bg-secondary p-3 rounded-lg transition-colors border border-border/50"
                onClick={() => setTaskPickerOpen(true)}
              >
                {focusedTask 
                  ? t('pomodoro.focusingOn', { taskTitle: focusedTask.title })
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
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : pomodoro.currentSession === 'shortBreak'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
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
                  {t('pomodoro.today')}
                </CardTitle>
                <CardDescription>
                  {t('pomodoro.todaySubtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-secondary/50 rounded-lg">
                    <div className="text-3xl font-bold text-primary">{totalPomosToday}</div>
                    <div className="text-sm text-muted-foreground">{t('pomodoro.sessions')}</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{formatDuration(totalFocusDurationToday)}</div>
                    <div className="text-sm text-muted-foreground">{t('pomodoro.focusTime')}</div>
                  </div>
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
                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FlagIcon className="h-4 w-4 text-red-500" />
                    <span className="font-medium">{t('pomodoro.focus')}</span>
                  </div>
                  <Badge variant="secondary">{pomodoro.settings.focusDuration} min</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <SunIcon className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{t('pomodoro.shortBreak')}</span>
                  </div>
                  <Badge variant="secondary">{pomodoro.settings.shortBreakDuration} min</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <SunIcon className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{t('pomodoro.longBreak')}</span>
                  </div>
                  <Badge variant="secondary">{pomodoro.settings.longBreakDuration} min</Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t('pomodoro.longBreakAfter')}</span>
                    <span className="font-medium">{pomodoro.settings.sessionsUntilLongBreak} {t('pomodoro.sessionsLabel')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('pomodoro.quickStats')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('pomodoro.totalSessionsLabel')}</span>
                  <span className="font-medium">{pomodoro.sessionsCompleted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('pomodoro.allTimeFocus')}</span>
                  <span className="font-medium">
                    {formatDuration(pomodoro.focusHistory.reduce((acc, curr) => acc + curr.duration, 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('pomodoro.averageSession')}</span>
                  <span className="font-medium">
                    {pomodoro.focusHistory.length > 0 
                      ? formatDuration(Math.round(pomodoro.focusHistory.reduce((acc, curr) => acc + curr.duration, 0) / pomodoro.focusHistory.length))
                      : t('pomodoro.zeroMinutes')
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {isTaskPickerOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[70vh]">
              <header className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('focusPicker.title')}</h2>
                <button onClick={() => setTaskPickerOpen(false)} className="p-1 rounded-full hover:bg-secondary">
                  ×
                </button>
              </header>
              <div className="grow p-4 overflow-y-auto">
                <ul className="space-y-2">
                  <li 
                    onClick={() => {
                      setFocusedTask(null)
                      setTaskPickerOpen(false)
                    }}
                    className="p-3 flex items-center justify-between rounded-md cursor-pointer hover:bg-secondary"
                  >
                    <span>{t('focusPicker.general')}</span>
                    {!pomodoro.focusedTaskId && <CheckCircleIcon className="h-5 w-5 text-primary" />}
                  </li>
                  {uncompletedTasks.map(task => (
                    <li 
                      key={task.id}
                      onClick={() => {
                        setFocusedTask(task.id)
                        setTaskPickerOpen(false)
                      }}
                      className="p-3 flex items-center justify-between rounded-md cursor-pointer hover:bg-secondary"
                    >
                      <span>{task.title}</span>
                      {pomodoro.focusedTaskId === task.id && <CheckCircleIcon className="h-5 w-5 text-primary" />}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </AppPageMain>
    </AppPage>
  )
}

export default PomodoroView

