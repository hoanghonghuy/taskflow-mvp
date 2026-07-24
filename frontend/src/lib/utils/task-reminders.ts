import type { Task } from '@/types'

export const REMINDER_CHECK_INTERVAL_MS = 60_000
export const REMINDER_STORAGE_PREFIX = 'reminder-'

export function getReminderStorageKey(taskId: string, dueDate?: string | Date | null): string {
  if (!dueDate) {
    return `${REMINDER_STORAGE_PREFIX}${taskId}`
  }
  const dueMs = new Date(dueDate).getTime()
  if (Number.isNaN(dueMs)) {
    return `${REMINDER_STORAGE_PREFIX}${taskId}`
  }
  return `${REMINDER_STORAGE_PREFIX}${taskId}-${dueMs}`
}

export function getReminderTime(dueDate: string | Date, reminderMinutes: number): Date {
  const due = new Date(dueDate)
  return new Date(due.getTime() - reminderMinutes * 60 * 1000)
}

export function isWithinReminderWindow(
  now: Date,
  dueDate: string | Date,
  reminderMinutes: number,
): boolean {
  const due = new Date(dueDate)
  const reminderTime = getReminderTime(dueDate, reminderMinutes)
  return now >= reminderTime && now < due
}

/**
 * Once a reminder has been shown for a due window (storage key), do not show again.
 * Corrupt/missing timestamps are treated as "not shown yet".
 */
export function shouldShowReminder(lastShownTimestamp: string | null): boolean {
  if (!lastShownTimestamp) {
    return true
  }

  const lastShown = parseInt(lastShownTimestamp, 10)
  if (Number.isNaN(lastShown)) {
    return true
  }

  return false
}

export function getTasksDueForReminder(tasks: Task[], now: Date): Task[] {
  return tasks.filter((task) => {
    if (task.completed) {
      return false
    }
    if (!task.dueDate || !task.reminderMinutes) {
      return false
    }
    return isWithinReminderWindow(now, task.dueDate, task.reminderMinutes)
  })
}
