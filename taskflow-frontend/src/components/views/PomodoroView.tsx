'use client'

import React, { useState, useMemo } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { usePomodoroActions } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { PlusIcon, CheckCircleIcon } from '@/lib/constants'
import { toYYYYMMDD } from '@/lib/utils/date-helpers'

const PomodoroView: React.FC = () => {
  const { state, dispatch } = useTaskManager()
  const { startTimer, pauseTimer, resetTimer, setFocusedTask } = usePomodoroActions()
  const { t } = useI18n()
  const { pomodoro } = state
  const [isTaskPickerOpen, setTaskPickerOpen] = useState(false)

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

  const totalDuration = pomodoro.settings[
    pomodoro.currentSession === 'focus' ? 'focusDuration' :
    pomodoro.currentSession === 'shortBreak' ? 'shortBreakDuration' : 'longBreakDuration'
  ] * 60
  const progress = totalDuration > 0 ? (totalDuration - pomodoro.remainingTime) / totalDuration : 0

  const uncompletedTasks = useMemo(() => {
    return state.tasks.filter(task => !task.completed)
  }, [state.tasks])

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <header className="p-6 border-b border-border flex-shrink-0">
        <h1 className="text-3xl font-bold">{t('nav.pomodoro')}</h1>
        <p className="text-muted-foreground">Focus timer</p>
      </header>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row h-full gap-8">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center mb-6">
              <p className="text-lg text-muted-foreground mb-2">
                {getSessionName()}
              </p>
              <div 
                className="text-xl md:text-2xl font-semibold min-h-[32px] cursor-pointer hover:bg-secondary p-2 rounded-md"
                onClick={() => setTaskPickerOpen(true)}
              >
                {focusedTask 
                  ? t('pomodoro.focusingOn', { taskTitle: focusedTask.title })
                  : t('pomodoro.selectTask')
                }
              </div>
            </div>

            <div className="relative w-60 h-60 md:w-72 md:h-72 flex items-center justify-center mb-8">
              <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                <circle className="text-secondary" strokeWidth="5" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <circle
                  className="text-primary transition-all duration-1000 ease-linear"
                  strokeWidth="5"
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
              <span className="text-5xl md:text-6xl font-bold font-mono tracking-tighter">
                {formatTime(pomodoro.remainingTime)}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={handleStop}
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-full text-md md:text-lg font-semibold hover:bg-muted transition-colors"
              >
                {t('pomodoro.stop')}
              </button>
              <button 
                onClick={handlePauseResume}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-full text-md md:text-lg font-semibold hover:bg-primary/90 w-32 transition-colors"
              >
                {pomodoro.isPaused || !pomodoro.isActive ? t('pomodoro.start') : t('pomodoro.pause')}
              </button>
            </div>
          </div>

          <div className="w-full md:w-80 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-4">{t('pomodoro.today')}</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">{t('pomodoro.sessions')}</p>
                  <p className="text-2xl font-bold">{totalPomosToday}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('pomodoro.focusTime')}</p>
                  <p className="text-2xl font-bold">{formatDuration(totalFocusDurationToday)}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-4">{t('pomodoro.settings')}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('pomodoro.focusDuration')}</span>
                  <span>{pomodoro.settings.focusDuration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('pomodoro.shortBreak')}</span>
                  <span>{pomodoro.settings.shortBreakDuration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('pomodoro.longBreak')}</span>
                  <span>{pomodoro.settings.longBreakDuration} min</span>
                </div>
              </div>
            </div>
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
              <div className="flex-grow p-4 overflow-y-auto">
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
      </main>
    </div>
  )
}

export default PomodoroView

