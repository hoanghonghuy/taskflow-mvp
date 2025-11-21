'use client'

import { useEffect, useRef } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useToast } from '@/lib/hooks/use-toast'
import { useSettings } from '@/components/providers/settings-provider'
import { useI18n } from '@/lib/hooks/use-i18n'

export const usePomodoroNotifications = () => {
  const { state } = useTaskManager()
  const { pomodoro } = state
  const { success } = useToast()
  const { settings } = useSettings()
  const { t } = useI18n()

  const previousSessionRef = useRef(pomodoro.currentSession)
  const previousFocusCountRef = useRef(pomodoro.focusHistory.length)

  useEffect(() => {
    const previousSession = previousSessionRef.current
    const previousFocusCount = previousFocusCountRef.current
    const currentSession = pomodoro.currentSession
    const currentFocusCount = pomodoro.focusHistory.length

    const focusJustCompleted =
      previousSession === 'focus' &&
      currentSession !== 'focus' &&
      currentFocusCount > previousFocusCount

    if (focusJustCompleted) {
      const latestFocus = pomodoro.focusHistory[currentFocusCount - 1]
      const { focusedTaskId, focusedHabitId } = pomodoro
      const focusedTask = state.tasks.find(t => t.id === focusedTaskId)
      const focusedHabit = state.habits.find(h => h.id === focusedHabitId)
      const focusLabel = focusedTask?.title ?? focusedHabit?.name

      if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
        const title = t('pomodoro.notifications.focusCompletedTitle')
        const body = focusLabel
          ? t('pomodoro.notifications.focusCompletedBodyWithTask', { taskTitle: focusLabel })
          : t('pomodoro.notifications.focusCompletedBody')

        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'pomodoro-focus',
        })

        if (settings.soundEnabled) {
          const audio = new Audio('/notification-sound.mp3')
          audio.volume = 0.5
          void audio.play().catch(() => {
            // Silently fail if sound file doesn't exist
          })
        }
      }

      if (settings.notifications) {
        success(
          t('pomodoro.notifications.toastFocusTitle'),
          focusLabel
            ? t('pomodoro.notifications.toastFocusBodyWithTask', { taskTitle: focusLabel })
            : t('pomodoro.notifications.toastFocusBody')
        )
      }

      void fetch('/api/pomodoro/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: latestFocus.startTime,
          durationSeconds: latestFocus.duration,
          type: 'focus',
          taskId: latestFocus.taskId ?? null,
          habitId: latestFocus.habitId ?? null,
        }),
      }).catch((error) => {
        console.error('Failed to sync pomodoro session to backend', error)
      })
    }

    previousSessionRef.current = currentSession
    previousFocusCountRef.current = currentFocusCount
  }, [pomodoro, state.tasks, state.habits, settings, success, t])
}
