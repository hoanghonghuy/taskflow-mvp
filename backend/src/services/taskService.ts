import type { Prisma, TodoList } from '@prisma/client'
import { toJsonString } from '../lib/json'
import { normalizeListId } from '../lib/inbox-list'
import { isListOwner, parseListMembers } from '../lib/list-access'
import { getNextOccurrence, parseRecurrence, appendCompletionDate } from '../lib/recurrence'
import { taskMatchesUserFacingSearch } from '../lib/task-search'
import { mapTaskToDto, type TaskDto } from '../mappers/task.mapper'
import { AppError } from '../middleware/errorHandler'
import { prisma } from '../lib/prisma'
import * as pomodoroRepository from '../repositories/pomodoroRepository'
import * as listRepository from '../repositories/listRepository'
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

async function assertValidAssignee(list: TodoList, assigneeId: string): Promise<void> {
  if (isListOwner(list, assigneeId)) return
  if (parseListMembers(list.members).includes(assigneeId)) return

  const user = await prisma.user.findUnique({ where: { id: assigneeId }, select: { id: true } })
  if (!user) {
    throw new AppError(400, 'invalid_request', 'Invalid assigneeId')
  }
  throw new AppError(400, 'invalid_request', 'Assignee must be the list owner or a member')
}

async function mapTasksWithFocus(tasks: Awaited<ReturnType<typeof taskRepository.findTasksAccessibleByUserId>>): Promise<TaskDto[]> {
  const ownerIds = [...new Set(tasks.map((task) => task.userId))]
  const focusMaps = await Promise.all(
    ownerIds.map((ownerId) => pomodoroRepository.sumFocusSecondsByTaskId(ownerId)),
  )
  const focusByTaskId = new Map<string, number>()
  for (const map of focusMaps) {
    for (const [taskId, seconds] of map) {
      focusByTaskId.set(taskId, seconds)
    }
  }
  return tasks.map((task) => mapTaskToDto(task, focusByTaskId.get(task.id) ?? 0))
}

export async function listTasks(userId: string): Promise<TaskDto[]> {
  const tasks = await taskRepository.findTasksAccessibleByUserId(userId)
  return mapTasksWithFocus(tasks)
}

export async function searchTasks(userId: string, query: string, limit: number): Promise<TaskDto[]> {
  // Over-fetch then filter user-facing fields so JSON metadata keys (id, completed, …)
  // from raw TEXT contains matches do not leak into results.
  const fetchLimit = Math.min(Math.max(limit * 5, limit), 200)
  const candidates = await taskRepository.searchTasksAccessibleByUserId(userId, query, fetchLimit)
  const mapped = await mapTasksWithFocus(candidates)
  return mapped.filter((task) => taskMatchesUserFacingSearch(task, query)).slice(0, limit)
}

export async function getTask(userId: string, id: string): Promise<TaskDto | null> {
  const task = await taskRepository.findTaskByIdAccessible(id, userId)
  if (!task) return null
  const totalFocusTime = await pomodoroRepository.sumFocusSecondsForTask(task.userId, id)
  return mapTaskToDto(task, totalFocusTime)
}

export async function createTask(userId: string, body: Record<string, unknown>): Promise<TaskDto> {
  const title = String(body.title ?? '').trim()
  if (!title) throw new AppError(400, 'invalid_request', 'Title must not be empty')

  const listId = await normalizeListId(userId, body.listId)

  const list = await listRepository.findListByIdAccessible(listId, userId)
  if (!list) {
    throw new AppError(400, 'invalid_request', 'Invalid listId')
  }
  if (list.userId !== userId) {
    throw new AppError(403, 'forbidden', 'You do not have permission to create tasks in this list')
  }

  const assigneeId =
    body.assigneeId != null ? String(body.assigneeId) : null
  if (assigneeId) {
    await assertValidAssignee(list, assigneeId)
  }

  const dueDate = 'dueDate' in body ? parseOptionalDate(body.dueDate) : null
  let recurrenceJson: string | null = null
  if (body.recurrence) {
    const raw =
      typeof body.recurrence === 'object' && body.recurrence !== null
        ? { ...(body.recurrence as Record<string, unknown>) }
        : {}
    if (!raw.seriesStart && dueDate) {
      raw.seriesStart = dueDate.toISOString().slice(0, 10)
    }
    recurrenceJson = toJsonString(raw)
  }

  // Bọc read max + create trong transaction serializable để tránh 2 request
  // song song của cùng user lấy cùng maxSortOrder → trùng sortOrder, phá vỡ
  // thứ tự board/list. Nếu conflict thì Prisma sẽ retry 1 lần.
  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const task = await prisma.$transaction(
        async (tx) => {
          const maxSortOrder = await taskRepository.findMaxSortOrder(userId, tx)
          return taskRepository.createTask(
            {
              title,
              description: body.description != null ? String(body.description) : null,
              dueDate,
              priority: normalizePriority(body.priority),
              listId,
              tags: toJsonString(Array.isArray(body.tags) ? body.tags : []),
              columnId: body.columnId != null ? String(body.columnId) : null,
              subtasks: toJsonString(Array.isArray(body.subtasks) ? body.subtasks : []),
              comments: toJsonString(Array.isArray(body.comments) ? body.comments : []),
              recurrence: recurrenceJson,
              reminderMinutes:
                typeof body.reminderMinutes === 'number' ? body.reminderMinutes : null,
              assigneeId,
              sortOrder: maxSortOrder + 1,
              user: { connect: { id: userId } },
            },
            tx,
          )
        },
        { isolationLevel: 'Serializable' },
      )
      return mapTaskToDto(task, 0)
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      const isSerializationFailure =
        message.includes('40001') || message.includes('could not serialize')
      if (!isSerializationFailure) throw error
    }
  }
  throw lastError
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
  if ('completed' in body) {
    const completed = Boolean(body.completed)
    if (completed) {
      const recurrence = parseRecurrence(existing.recurrence)
      if (recurrence && existing.dueDate) {
        const seriesStart = recurrence.seriesStart
          ? new Date(recurrence.seriesStart)
          : existing.dueDate
        const nextDue = getNextOccurrence(existing.dueDate, recurrence, seriesStart)
        if (nextDue) {
          const preserved = new Date(nextDue)
          preserved.setUTCHours(
            existing.dueDate.getUTCHours(),
            existing.dueDate.getUTCMinutes(),
            existing.dueDate.getUTCSeconds(),
            existing.dueDate.getUTCMilliseconds(),
          )
          data.completed = false
          data.completedAt = null
          data.dueDate = preserved
          data.recurrence = appendCompletionDate(existing.recurrence, new Date())
        } else {
          data.completed = true
          data.completedAt = new Date()
        }
      } else {
        data.completed = true
        data.completedAt = new Date()
      }
    } else {
      data.completed = false
      data.completedAt = null
    }
  }
  if ('dueDate' in body) data.dueDate = parseOptionalDate(body.dueDate)
  if ('priority' in body && body.priority != null) data.priority = normalizePriority(body.priority)
  if ('listId' in body && body.listId != null) {
    const nextListId = await normalizeListId(userId, body.listId)
    const ownedList = await listRepository.findListByIdAndUserId(nextListId, userId)
    if (!ownedList) {
      const accessible = await listRepository.findListByIdAccessible(nextListId, userId)
      if (accessible) {
        throw new AppError(403, 'forbidden', 'You do not have permission to move tasks into this list')
      }
      throw new AppError(400, 'invalid_request', 'Invalid listId')
    }
    data.listId = nextListId
  }
  if ('tags' in body && body.tags != null) data.tags = toJsonString(body.tags)
  if ('columnId' in body) data.columnId = body.columnId != null ? String(body.columnId) : null
  if ('subtasks' in body && body.subtasks != null) data.subtasks = toJsonString(body.subtasks)
  if ('comments' in body && body.comments != null) data.comments = toJsonString(body.comments)
  if ('recurrence' in body) {
    if (!body.recurrence) {
      data.recurrence = null
    } else {
      const raw =
        typeof body.recurrence === 'object' && body.recurrence !== null
          ? { ...(body.recurrence as Record<string, unknown>) }
          : {}
      if (!raw.seriesStart) {
        const dueForSeries =
          'dueDate' in body
            ? parseOptionalDate(body.dueDate)
            : existing.dueDate
        if (dueForSeries) {
          raw.seriesStart = dueForSeries.toISOString().slice(0, 10)
        }
      }
      data.recurrence = toJsonString(raw)
    }
  }
  if ('reminderMinutes' in body) {
    data.reminderMinutes = typeof body.reminderMinutes === 'number' ? body.reminderMinutes : null
  }
  if ('assigneeId' in body) {
    const nextAssignee = body.assigneeId != null ? String(body.assigneeId) : null
    if (nextAssignee) {
      const listIdForAssignee =
        'listId' in body && body.listId != null
          ? await normalizeListId(userId, body.listId)
          : existing.listId
      const list = await listRepository.findListByIdAndUserId(listIdForAssignee, userId)
      if (!list) {
        throw new AppError(400, 'invalid_request', 'Invalid listId for assignee')
      }
      await assertValidAssignee(list, nextAssignee)
    }
    data.assigneeId = nextAssignee
  }

  const updated = await taskRepository.updateTask(id, data)
  const totalFocusTime = await pomodoroRepository.sumFocusSecondsForTask(userId, id)
  return mapTaskToDto(updated, totalFocusTime)
}

export async function deleteTask(userId: string, id: string): Promise<boolean> {
  const owned = await taskRepository.findTaskByIdAndUserId(id, userId)
  if (owned) {
    await taskRepository.deleteTask(id)
    return true
  }

  const accessible = await taskRepository.findTaskByIdAccessible(id, userId)
  if (accessible) {
    throw new AppError(403, 'forbidden', 'You do not have permission to delete this task')
  }

  return false
}

export async function reorderTasks(userId: string, taskIds: string[]): Promise<TaskDto[]> {
  const existing = await taskRepository.findTasksByUserId(userId)
  const existingIds = new Set(existing.map((t) => t.id))

  if (taskIds.length !== existing.length) {
    throw new AppError(400, 'invalid_request', 'taskIds must include every task')
  }

  if (new Set(taskIds).size !== taskIds.length) {
    throw new AppError(400, 'invalid_request', 'Duplicate task id in reorder list')
  }

  for (const id of taskIds) {
    if (!existingIds.has(id)) {
      throw new AppError(400, 'invalid_request', 'Invalid task id in reorder list')
    }
  }

  await taskRepository.updateTaskSortOrders(userId, taskIds)
  const tasks = await taskRepository.findTasksByUserId(userId)
  const focusByTaskId = await pomodoroRepository.sumFocusSecondsByTaskId(userId)
  return tasks.map((task) => mapTaskToDto(task, focusByTaskId.get(task.id) ?? 0))
}
