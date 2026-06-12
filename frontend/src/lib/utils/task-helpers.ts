/**
 * Task filtering and sorting helper functions
 */

import type { Column, List, Task } from '@/types'
import type { TranslationFunction } from '@/lib/i18n/types'
import { isToday, isTomorrow, isFuture, isOverdue } from './date-helpers'

export type SortOrder = 'default' | 'dueDateAsc' | 'dueDateDesc'

const DEFAULT_COLUMN_DEFS = [
  { suffix: 'todo', name: 'To Do' },
  { suffix: 'in-progress', name: 'In Progress' },
  { suffix: 'done', name: 'Done' },
] as const

function defaultColumnId(listId: string, suffix: string): string {
  return listId === 'inbox' ? suffix : `${listId}-${suffix}`
}

/** Rebuild board columns from lists + tasks after loading from backend. */
export function buildBoardColumns(lists: List[], tasks: Task[]): Column[] {
  const columns: Column[] = []
  const seen = new Set<string>()

  for (const list of lists) {
    for (const def of DEFAULT_COLUMN_DEFS) {
      const id = defaultColumnId(list.id, def.suffix)
      if (!seen.has(id)) {
        columns.push({ id, name: def.name, listId: list.id })
        seen.add(id)
      }
    }
  }

  for (const task of tasks) {
    if (!task.columnId || !task.listId) continue
    const key = `${task.listId}:${task.columnId}`
    if (seen.has(key)) continue
    columns.push({
      id: task.columnId,
      name: 'Column',
      listId: task.listId,
    })
    seen.add(key)
  }

  return columns
}

/** Merge persisted board columns with defaults derived from lists/tasks. */
export function resolveBoardColumns(
  savedColumns: Column[],
  lists: List[],
  tasks: Task[],
): Column[] {
  if (savedColumns.length === 0) {
    return buildBoardColumns(lists, tasks)
  }

  const byId = new Map<string, Column>()
  for (const column of savedColumns) {
    if (column.id && column.name && column.listId) {
      byId.set(column.id, column)
    }
  }

  for (const column of buildBoardColumns(lists, tasks)) {
    if (!byId.has(column.id)) {
      byId.set(column.id, column)
    }
  }

  return [...byId.values()]
}

export function resolveInboxListIdFromLists(lists: List[]): string | null {
  const inbox = lists.find((l) => l.name === 'Inbox' || l.id === 'inbox')
  return inbox?.id ?? null
}

export const filterTasksByList = (
  tasks: Task[],
  listId: string | null,
  activeTag: string | null,
  inboxListId?: string | null,
): Task[] => {
  if (activeTag) {
    return tasks.filter(task => task.tags.includes(activeTag))
  }

  if (!listId) return tasks

  switch (listId) {
    case 'today':
      return tasks.filter(task => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        if (!task.completed && isOverdue(taskDate)) return true
        return isToday(taskDate)
      })
    case 'upcoming':
      return tasks.filter(task => task.dueDate && isFuture(new Date(task.dueDate)))
    case 'inbox': {
      const resolvedInbox = inboxListId ?? 'inbox'
      return tasks.filter(
        (task) => task.listId === resolvedInbox || task.listId === 'inbox',
      )
    }
    default:
      return tasks.filter(task => task.listId === listId)
  }
}

export const sortTasks = (tasks: Task[], sortOrder: SortOrder, allTasks: Task[]): Task[] => {
  if (sortOrder === 'default') {
    return [...tasks].sort((a, b) => {
      const aIsRecurringInstance = a.id.includes('_')
      const bIsRecurringInstance = b.id.includes('_')
      const originalAId = aIsRecurringInstance ? a.id.split('_')[0] : a.id
      const originalBId = bIsRecurringInstance ? b.id.split('_')[0] : b.id

      const aIndex = allTasks.findIndex(t => t.id === originalAId)
      const bIndex = allTasks.findIndex(t => t.id === originalBId)
      return aIndex - bIndex
    })
  }

  return [...tasks].sort((a, b) => {
    const aHasDate = !!a.dueDate
    const bHasDate = !!b.dueDate

    if (aHasDate && !bHasDate) return -1
    if (!aHasDate && bHasDate) return 1
    if (!aHasDate && !bHasDate) return 0

    const dateA = new Date(a.dueDate!).getTime()
    const dateB = new Date(b.dueDate!).getTime()

    return sortOrder === 'dueDateAsc' ? dateA - dateB : dateB - dateA
  })
}

export const groupUpcomingTasks = (
  tasks: Task[],
  t: TranslationFunction
): { [key: string]: Task[] } => {
  const groups: { [key: string]: Task[] } = {}
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const endOfWeek = new Date(today)
  // Set to the upcoming Sunday
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()) % 7)

  tasks.forEach(task => {
    if (!task.dueDate) return
    const dueDate = new Date(task.dueDate)
    dueDate.setHours(0, 0, 0, 0)

    // Skip non-future tasks
    if (dueDate < today) return

    let groupKey: string

    if (isTomorrow(dueDate)) {
      groupKey = t('specialLists.tomorrow')
    } else if (dueDate > tomorrow && dueDate <= endOfWeek) {
      groupKey = dueDate.toLocaleDateString(undefined, { weekday: 'long' })
    } else {
      groupKey = dueDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(task)
  })

  return groups
}

