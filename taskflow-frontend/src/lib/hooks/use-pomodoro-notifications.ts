'use client'

import { useEffect } from 'react'
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

  useEffect(() => {
    // Check if a session just completed (remainingTime reached 0)
    if (pomodoro.isActive && pomodoro.remainingTime === 0) {
      const { currentSession, focusedTaskId, focusedHabitId } = pomodoro
      const focusedTask = state.tasks.find(t => t.id === focusedTaskId)
      const focusedHabit = state.habits.find(h => h.id === focusedHabitId)
      const focusLabel = focusedTask?.title ?? focusedHabit?.name

      // Send browser notification
      if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
        let title = ''
        let body = ''

        switch (currentSession) {
          case 'focus':
            title = t('pomodoro.notifications.focusCompletedTitle')
            body = focusLabel
              ? t('pomodoro.notifications.focusCompletedBodyWithTask', { taskTitle: focusLabel })
              : t('pomodoro.notifications.focusCompletedBody')
            break
          case 'shortBreak':
            title = t('pomodoro.notifications.shortBreakOverTitle')
            body = t('pomodoro.notifications.shortBreakOverBody')
            break
          case 'longBreak':
            title = t('pomodoro.notifications.longBreakOverTitle')
            body = t('pomodoro.notifications.longBreakOverBody')
            break
        }

        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: `pomodoro-${currentSession}`,
        })

        // Play sound if enabled
        if (settings.soundEnabled) {
          const audio = new Audio('/notification-sound.mp3')
          audio.volume = 0.5
          audio.play().catch(() => {
            // Silently fail if sound file doesn't exist
          })
        }
      }

      // Send toast notification
      if (settings.notifications) {
        switch (currentSession) {
          case 'focus':
            success(
              t('pomodoro.notifications.toastFocusTitle'),
              focusLabel
                ? t('pomodoro.notifications.toastFocusBodyWithTask', { taskTitle: focusLabel })
                : t('pomodoro.notifications.toastFocusBody')
            )
            break
          case 'shortBreak':
            success(
              t('pomodoro.notifications.toastShortBreakTitle'),
              t('pomodoro.notifications.toastShortBreakBody')
            )
            break
          case 'longBreak':
            success(
              t('pomodoro.notifications.toastLongBreakTitle'),
              t('pomodoro.notifications.toastLongBreakBody')
            )
            break
        }
      }
    }
  }, [pomodoro, state.tasks, state.habits, settings, success, t])
}
