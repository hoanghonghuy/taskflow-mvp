import type { Prisma } from '@prisma/client'
import { toJsonString } from '../lib/json'
import { normalizeListId } from '../lib/inbox-list'
import { mapTaskToDto, type TaskDto } from '../mappers/task.mapper'
import { AppError } from '../middleware/errorHandler'
import * as taskRepository from '../repositories/taskRepository'

const VALID_PRIORITIES = new Set(['none', 'low', 'medium', 'high', 'urgent'])

function parseOptionalDate(value: unknown): Date | null {
  if (value == null || value === '') return null
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(400, 'invalid_request', 'Invalid dueDate')
  }
  return parsed
}

function normalizePriority(value: unknown): string {
  if (typeof value !== 'string') return 'none'
  const lower = value.trim().toLowerCase()
  return VALID_PRIORITIES.has(lower) ? lower : 'none'
}

export async function listTasks(userId: string): Promise<TaskDto[]> {
  const tasks = await taskRepository.findTasksByUserId(userId)
  return tasks.map(mapTaskToDto)
}

export async function getTask(userId: string, id: string): Promise<TaskDto | null> {
  const task = await taskRepository.findTaskByIdAndUserId(id, userId)
  return task ? mapTaskToDto(task) : null
}

export async function createTask(userId: string, body: Record<string, unknown>): Promise<TaskDto> {
  const title = String(body.title ?? '').trim()
  if (!title) throw new AppError(400, 'invalid_request', 'Title must not be empty')

  const listId = await normalizeListId(userId, body.listId)

  const task = await taskRepository.createTask({
    title,
    description: body.description != null ? String(body.description) : null,
    dueDate: 'dueDate' in body ? parseOptionalDate(body.dueDate) : null,
    priority: normalizePriority(body.priority),
    listId,
    tags: toJsonString(Array.isArray(body.tags) ? body.tags : []),
    columnId: body.columnId != null ? String(body.columnId) : null,
    subtasks: toJsonString(Array.isArray(body.subtasks) ? body.subtasks : []),
    comments: toJsonString(Array.isArray(body.comments) ? body.comments : []),
    recurrence: body.recurrence ? toJsonString(body.recurrence) : null,
    reminderMinutes: typeof body.reminderMinutes === 'number' ? body.reminderMinutes : null,
    assigneeId: body.assigneeId != null ? String(body.assigneeId) : null,
    user: { connect: { id: userId } },
  })

  return mapTaskToDto(task)
}

export async function updateTask(
  userId: string,
  id: string,
  body: Record<string, unknown>,
): Promise<TaskDto | null> {
  const existing = await taskRepository.findTaskByIdAndUserId(id, userId)
  if (!existing) return null

  const data: Prisma.TodoTaskUpdateInput = {}

  if ('title' in body && body.title != null) {
    const title = String(body.title).trim()
    if (!title) throw new AppError(400, 'invalid_request', 'Title must not be empty')
    data.title = title
  }
  if ('description' in body) data.description = body.description != null ? String(body.description) : null
  if ('completed' in body) data.completed = Boolean(body.completed)
  if ('dueDate' in body) data.dueDate = parseOptionalDate(body.dueDate)
  if ('priority' in body && body.priority != null) data.priority = normalizePriority(body.priority)
  if ('listId' in body && body.listId != null) {
    data.listId = await normalizeListId(userId, body.listId)
  }
  if ('tags' in body && body.tags != null) data.tags = toJsonString(body.tags)
  if ('columnId' in body) data.columnId = body.columnId != null ? String(body.columnId) : null
  if ('subtasks' in body && body.subtasks != null) data.subtasks = toJsonString(body.subtasks)
  if ('comments' in body && body.comments != null) data.comments = toJsonString(body.comments)
  if ('recurrence' in body) data.recurrence = body.recurrence ? toJsonString(body.recurrence) : null
  if ('reminderMinutes' in body) {
    data.reminderMinutes = typeof body.reminderMinutes === 'number' ? body.reminderMinutes : null
  }
  if ('assigneeId' in body) data.assigneeId = body.assigneeId != null ? String(body.assigneeId) : null

  const updated = await taskRepository.updateTask(id, data)
  return mapTaskToDto(updated)
}

export async function deleteTask(userId: string, id: string): Promise<boolean> {
  const existing = await taskRepository.findTaskByIdAndUserId(id, userId)
  if (!existing) return false
  await taskRepository.deleteTask(id)
  return true
}
