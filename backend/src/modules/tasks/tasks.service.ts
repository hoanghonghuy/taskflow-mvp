import { prisma } from '../../lib/prisma'
import { toJsonString } from '../../lib/json'
import { mapTaskToDto, type TaskDto } from '../../mappers/task.mapper'
import { AppError } from '../../middleware/errorHandler'

const VALID_PRIORITIES = new Set(['none', 'low', 'medium', 'high', 'urgent'])

function normalizePriority(value: unknown): string {
  if (typeof value !== 'string') return 'none'
  const lower = value.trim().toLowerCase()
  return VALID_PRIORITIES.has(lower) ? lower : 'none'
}

export async function listTasks(userId: string): Promise<TaskDto[]> {
  const tasks = await prisma.todoTask.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  return tasks.map(mapTaskToDto)
}

export async function getTask(userId: string, id: string): Promise<TaskDto | null> {
  const task = await prisma.todoTask.findFirst({ where: { id, userId } })
  return task ? mapTaskToDto(task) : null
}

export async function createTask(userId: string, body: Record<string, unknown>): Promise<TaskDto> {
  const title = String(body.title ?? '').trim()
  if (!title) throw new AppError(400, 'invalid_request', 'Title must not be empty')

  const task = await prisma.todoTask.create({
    data: {
      title,
      description: body.description != null ? String(body.description) : null,
      dueDate: body.dueDate ? new Date(String(body.dueDate)) : null,
      priority: normalizePriority(body.priority),
      listId: body.listId ? String(body.listId) : 'inbox',
      tags: toJsonString(Array.isArray(body.tags) ? body.tags : []),
      columnId: body.columnId != null ? String(body.columnId) : null,
      subtasks: toJsonString(Array.isArray(body.subtasks) ? body.subtasks : []),
      comments: toJsonString(Array.isArray(body.comments) ? body.comments : []),
      recurrence: body.recurrence ? toJsonString(body.recurrence) : null,
      reminderMinutes: typeof body.reminderMinutes === 'number' ? body.reminderMinutes : null,
      assigneeId: body.assigneeId != null ? String(body.assigneeId) : null,
      userId,
    },
  })

  return mapTaskToDto(task)
}

export async function updateTask(
  userId: string,
  id: string,
  body: Record<string, unknown>,
): Promise<TaskDto | null> {
  const existing = await prisma.todoTask.findFirst({ where: { id, userId } })
  if (!existing) return null

  const data: Record<string, unknown> = {}

  if ('title' in body && body.title != null) data.title = String(body.title).trim()
  if ('description' in body) data.description = body.description != null ? String(body.description) : null
  if ('completed' in body) data.completed = Boolean(body.completed)
  if ('dueDate' in body) data.dueDate = body.dueDate ? new Date(String(body.dueDate)) : null
  if ('priority' in body && body.priority != null) data.priority = normalizePriority(body.priority)
  if ('listId' in body && body.listId != null) data.listId = String(body.listId)
  if ('tags' in body && body.tags != null) data.tags = toJsonString(body.tags)
  if ('columnId' in body) data.columnId = body.columnId != null ? String(body.columnId) : null
  if ('subtasks' in body && body.subtasks != null) data.subtasks = toJsonString(body.subtasks)
  if ('comments' in body && body.comments != null) data.comments = toJsonString(body.comments)
  if ('recurrence' in body) data.recurrence = body.recurrence ? toJsonString(body.recurrence) : null
  if ('reminderMinutes' in body) {
    data.reminderMinutes = typeof body.reminderMinutes === 'number' ? body.reminderMinutes : null
  }
  if ('assigneeId' in body) data.assigneeId = body.assigneeId != null ? String(body.assigneeId) : null

  const updated = await prisma.todoTask.update({ where: { id }, data })
  return mapTaskToDto(updated)
}

export async function deleteTask(userId: string, id: string): Promise<boolean> {
  const existing = await prisma.todoTask.findFirst({ where: { id, userId } })
  if (!existing) return false
  await prisma.todoTask.delete({ where: { id } })
  return true
}
