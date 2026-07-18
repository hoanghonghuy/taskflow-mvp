import { describe, expect, it } from 'vitest'
import {
  getReminderStorageKey,
  getReminderTime,
  getTasksDueForReminder,
  isWithinReminderWindow,
  shouldShowReminder,
} from '@/lib/utils/task-reminders'
import type { Task } from '@/types'

const baseTask = (overrides: Partial<Task>): Task => ({
  id: '1',
  title: 'Demo task',
  description: '',
  completed: false,
  priority: 'none',
  listId: 'inbox',
  tags: [],
  subtasks: [],
  comments: [],
  assigneeId: null,
  ...overrides,
})

describe('task-reminders', () => {
  it('getReminderTime subtracts reminder minutes from due date', () => {
    const dueDate = new Date('2026-06-16T12:00:00.000Z')
    const reminderTime = getReminderTime(dueDate, 15)
    expect(reminderTime.toISOString()).toBe('2026-06-16T11:45:00.000Z')
  })

  it('isWithinReminderWindow is true between reminder and due time', () => {
    const dueDate = new Date('2026-06-16T12:00:00.000Z')
    const now = new Date('2026-06-16T11:50:00.000Z')
    expect(isWithinReminderWindow(now, dueDate, 15)).toBe(true)
    expect(isWithinReminderWindow(new Date('2026-06-16T11:40:00.000Z'), dueDate, 15)).toBe(false)
    expect(isWithinReminderWindow(new Date('2026-06-16T12:00:00.000Z'), dueDate, 15)).toBe(false)
  })

  it('shouldShowReminder shows only once per due window', () => {
    expect(shouldShowReminder(null)).toBe(true)
    expect(shouldShowReminder('invalid')).toBe(true)
    expect(shouldShowReminder('1718539200000')).toBe(false)
  })

  it('getTasksDueForReminder filters completed and out-of-window tasks', () => {
    const dueDate = new Date('2026-06-16T12:00:00.000Z')
    const now = new Date('2026-06-16T11:50:00.000Z')
    const tasks = [
      baseTask({ id: 'due', dueDate: dueDate.toISOString(), reminderMinutes: 15 }),
      baseTask({ id: 'done', dueDate: dueDate.toISOString(), reminderMinutes: 15, completed: true }),
      baseTask({ id: 'no-reminder', dueDate: dueDate.toISOString() }),
      baseTask({ id: 'early', dueDate: dueDate.toISOString(), reminderMinutes: 5 }),
    ]

    const due = getTasksDueForReminder(tasks, now)
    expect(due.map((task) => task.id)).toEqual(['due'])
  })

  it('getReminderStorageKey includes due timestamp so recurrence windows reset', () => {
    const due = '2026-06-16T12:00:00.000Z'
    expect(getReminderStorageKey('abc', due)).toBe(`reminder-abc-${new Date(due).getTime()}`)
  })
})
