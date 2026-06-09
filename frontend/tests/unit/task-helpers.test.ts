import { describe, expect, it } from 'vitest'
import { filterTasksByList, groupUpcomingTasks, sortTasks } from '@/lib/utils/task-helpers'
import type { Task } from '@/types'

const t = (key: string) => key

const baseTask = (overrides: Partial<Task>): Task => ({
  id: '1',
  title: 'T',
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

describe('task-helpers', () => {
  const tasks: Task[] = [
    baseTask({ id: '1', listId: 'inbox', tags: ['work'] }),
    baseTask({ id: '2', listId: 'work', dueDate: new Date().toISOString() }),
    baseTask({
      id: '3',
      listId: 'personal',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    }),
  ]

  it('filterTasksByList by tag and list', () => {
    expect(filterTasksByList(tasks, 'inbox', 'work')).toHaveLength(1)
    expect(filterTasksByList(tasks, 'work', null)).toHaveLength(1)
    expect(filterTasksByList(tasks, 'inbox', null)).toHaveLength(1)
    expect(filterTasksByList(tasks, null, null)).toHaveLength(3)
  })

  it('sortTasks default and by due date', () => {
    const withDates = [
      baseTask({ id: 'a', dueDate: '2026-12-01T00:00:00.000Z' }),
      baseTask({ id: 'b' }),
      baseTask({ id: 'c', dueDate: '2026-06-01T00:00:00.000Z' }),
    ]
    const asc = sortTasks(withDates, 'dueDateAsc', withDates)
    expect(asc[0].id).toBe('c')
    const desc = sortTasks(withDates, 'dueDateDesc', withDates)
    expect(desc[0].id).toBe('a')
    const def = sortTasks(withDates, 'default', withDates)
    expect(def[0].id).toBe('a')
  })

  it('groupUpcomingTasks groups by date', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const grouped = groupUpcomingTasks(
      [baseTask({ id: 'x', dueDate: tomorrow.toISOString() })],
      t,
    )
    expect(Object.keys(grouped).length).toBeGreaterThan(0)
  })
})
