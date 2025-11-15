/**
 * Task filtering and sorting helper functions
 */

import type { Task } from '@/types'
import { isToday, isTomorrow, isFuture, isOverdue } from './date-helpers'

export type SortOrder = 'default' | 'dueDateAsc' | 'dueDateDesc'

export const filterTasksByList = (
  tasks: Task[],
  listId: string | null,
  activeTag: string | null
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
    case 'inbox':
      return tasks.filter(task => task.listId === 'inbox')
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
  t: (key: any, options?: Record<string, string | number>) => string
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
      groupKey = t('specialLists.tomorrow') || 'Tomorrow'
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

