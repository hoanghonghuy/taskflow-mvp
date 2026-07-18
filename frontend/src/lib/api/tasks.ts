import type { Comment, Subtask, Task } from '@/types'
import { apiFetch, apiFetchJson } from './client'
import { mapTasksFromApi } from './mappers'

export type TaskCreatePayload = {
  title: string
  description?: string
  dueDate?: string | null
  priority?: Task['priority']
  listId: string
  columnId?: string | null
  tags?: string[]
  recurrence?: Task['recurrence'] | null
  reminderMinutes?: number | null
  assigneeId?: string | null
}

export type TaskUpdatePayload = Partial<TaskCreatePayload> & {
  completed?: boolean
  subtasks?: Subtask[]
  comments?: Comment[]
}

export async function fetchTasks(): Promise<Task[]> {
  // KHÔNG nuốt lỗi: caller (useTaskManager) sẽ set state.error để UI hiển thị
  // banner/thông báo. Trước đây .catch(() => null) trả [] khiến user thấy
  // task list rỗng mà không biết backend lỗi.
  const json = await apiFetchJson<unknown[]>('/api/tasks')
  return Array.isArray(json) ? mapTasksFromApi(json) : []
}

export async function searchTasks(query: string, limit = 50): Promise<Task[]> {
  const params = new URLSearchParams()
  params.set('q', query.trim())
  params.set('limit', String(limit))
  const json = await apiFetchJson<unknown[]>(`/api/tasks/search?${params.toString()}`)
  return Array.isArray(json) ? mapTasksFromApi(json) : []
}

export async function createTask(payload: TaskCreatePayload): Promise<Task | null> {
  const json = await apiFetchJson<unknown>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return mapTasksFromApi([json])[0] ?? null
}

export async function updateTask(id: string, payload: TaskUpdatePayload): Promise<Task | null> {
  const json = await apiFetchJson<unknown>(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return mapTasksFromApi([json])[0] ?? null
}

export async function reorderTasks(taskIds: string[]): Promise<Task[]> {
  const json = await apiFetchJson<unknown[]>('/api/tasks/reorder', {
    method: 'POST',
    body: JSON.stringify({ taskIds }),
  })
  return Array.isArray(json) ? mapTasksFromApi(json) : []
}

export async function deleteTask(id: string): Promise<void> {
  const response = await apiFetch(`/api/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' })
  // 404 = already gone (idempotent). 403 = forbidden — must not look like success.
  if (response.status === 404) return
  if (!response.ok) {
    throw new Error(`Failed to delete task: ${response.status}`)
  }
}
