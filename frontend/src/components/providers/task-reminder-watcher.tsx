'use client'

import { useTaskReminders } from '@/lib/hooks/use-task-reminders'

export function TaskReminderWatcher() {
  useTaskReminders()
  return null
}
