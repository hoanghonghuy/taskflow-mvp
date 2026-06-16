'use client'

import { useEffect } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useToast } from '@/lib/hooks/use-toast'
import { useSettings } from '@/components/providers/settings-provider'
import { useUser } from '@/components/providers/user-provider'
import { useI18n } from '@/lib/i18n/hooks'
import type { TranslationKey } from '@/lib/i18n/types'
import {
  REMINDER_CHECK_INTERVAL_MS,
  getReminderStorageKey,
  getTasksDueForReminder,
  shouldShowReminder,
} from '@/lib/utils/task-reminders'

export function useTaskReminders() {
  const { state } = useTaskManager()
  const { info } = useToast()
  const { settings } = useSettings()
  const { isAuthenticated } = useUser()
  const { t } = useI18n()

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !settings.notifications) {
      return
    }

    const checkReminders = () => {
      const now = new Date()
      const dueTasks = getTasksDueForReminder(state.tasks, now)

      for (const task of dueTasks) {
        const storageKey = getReminderStorageKey(task.id)
        const lastShown = localStorage.getItem(storageKey)

        if (!shouldShowReminder(now, lastShown)) {
          continue
        }

        const title = t('reminder.notificationTitle' as TranslationKey)
        const body = t('reminder.notificationBody' as TranslationKey, { title: task.title })

        info(title, body)

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: `task-reminder-${task.id}`,
          })
        }

        if (settings.soundEnabled) {
          const audio = new Audio('/notification-sound.mp3')
          audio.volume = 0.5
          void audio.play().catch(() => {
            // Silently fail if sound file is unavailable
          })
        }

        localStorage.setItem(storageKey, now.getTime().toString())
      }
    }

    const interval = setInterval(checkReminders, REMINDER_CHECK_INTERVAL_MS)
    checkReminders()

    return () => clearInterval(interval)
  }, [state.tasks, settings.notifications, settings.soundEnabled, isAuthenticated, info, t])
}
