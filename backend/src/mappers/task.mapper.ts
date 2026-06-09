import type { TodoTask } from '@prisma/client'
import { parseJsonArray, parseJsonObject } from '../lib/json'

export interface SubtaskDto {
  id: string
  title: string
  completed: boolean
}

export interface CommentDto {
  id: string
  userId: string
  content: string
  timestamp: string
}

export interface RecurrenceDto {
  type: string
  interval: number
  daysOfWeek?: number[]
  endDate?: string
}

export interface TaskDto {
  id: string
  title: string
  description: string | null
  completed: boolean
  createdAt: string
  dueDate: string | null
  priority: string
  listId: string
  tags: string[]
  columnId: string | null
  subtasks: SubtaskDto[]
  comments: CommentDto[]
  recurrence: RecurrenceDto | null
  reminderMinutes: number | null
  assigneeId: string | null
  sortOrder: number
}

export function mapTaskToDto(task: TodoTask): TaskDto {
  const recurrence = parseJsonObject<RecurrenceDto>(task.recurrence)
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.completed,
    createdAt: task.createdAt.toISOString(),
    dueDate: task.dueDate?.toISOString() ?? null,
    priority: task.priority,
    listId: task.listId,
    tags: parseJsonArray<string>(task.tags),
    columnId: task.columnId,
    subtasks: parseJsonArray<SubtaskDto>(task.subtasks),
    comments: parseJsonArray<CommentDto>(task.comments),
    recurrence,
    reminderMinutes: task.reminderMinutes,
    assigneeId: task.assigneeId,
    sortOrder: task.sortOrder,
  }
}
