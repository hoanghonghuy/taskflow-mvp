import type { Task } from '@/types'

export const REMINDER_CHECK_INTERVAL_MS = 60_000
export const REMINDER_COOLDOWN_MS = 60_000
export const REMINDER_STORAGE_PREFIX = 'reminder-'

export function getReminderStorageKey(taskId: string): string {
  return `${REMINDER_STORAGE_PREFIX}${taskId}`
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

export function shouldShowReminder(
  now: Date,
  lastShownTimestamp: string | null,
  cooldownMs = REMINDER_COOLDOWN_MS,
): boolean {
  if (!lastShownTimestamp) {
    return true
  }

  const lastShown = parseInt(lastShownTimestamp, 10)
  if (Number.isNaN(lastShown)) {
    return true
  }

  return now.getTime() - lastShown > cooldownMs
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
