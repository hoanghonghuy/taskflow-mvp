import type { FocusSession, PomodoroState } from '@/types'
import { apiFetch, unwrapApiData } from './client'
import {
  mapFocusSessionsFromApi,
  mapPomodoroStateFromApi,
  pomodoroStateToApiPayload,
  readPomodoroUpdatedAt,
} from './mappers'

export async function fetchPomodoroSessions(): Promise<FocusSession[]> {
  const response = await apiFetch('/api/pomodoro/sessions')
  if (!response.ok) return []
  const raw = await response.json().catch(() => null)
  const json = raw ? unwrapApiData<unknown>(raw, response.status) : null
  return Array.isArray(json) ? mapFocusSessionsFromApi(json) : []
}

export type PomodoroStateFetchResult = {
  patch: Partial<PomodoroState>
  updatedAt: string | null
}

export async function fetchPomodoroState(
  fallback: PomodoroState,
): Promise<PomodoroStateFetchResult | null> {
  const response = await apiFetch('/api/pomodoro/state')
  if (!response.ok) return null
  const raw = await response.json().catch(() => null)
  const json = raw ? unwrapApiData<unknown>(raw, response.status) : null
  if (json == null) return null
  const patch = mapPomodoroStateFromApi(json, fallback)
  if (!patch) return null
  return { patch, updatedAt: readPomodoroUpdatedAt(json) }
}

export async function updatePomodoroState(
  state: PomodoroState,
  options?: { keepalive?: boolean; expectedUpdatedAt?: string | null },
): Promise<{ ok: boolean; conflict: boolean; updatedAt: string | null }> {
  const includeLock = !options?.keepalive && options?.expectedUpdatedAt !== undefined
  const response = await apiFetch('/api/pomodoro/state', {
    method: 'PUT',
    body: JSON.stringify(
      pomodoroStateToApiPayload(
        state,
        includeLock ? options.expectedUpdatedAt : undefined,
      ),
    ),
    keepalive: options?.keepalive,
  })

  if (response.status === 409) {
    return { ok: false, conflict: true, updatedAt: null }
  }

  if (!response.ok) {
    if (options?.keepalive) {
      return { ok: false, conflict: false, updatedAt: null }
    }
    throw new Error(`Failed to update pomodoro state: ${response.status}`)
  }

  const raw = await response.json().catch(() => null)
  const json = raw ? unwrapApiData<unknown>(raw, response.status) : null
  return { ok: true, conflict: false, updatedAt: readPomodoroUpdatedAt(json) }
}

export async function createPomodoroSession(payload: {
  startTime: string
  durationSeconds: number
  type: string
  taskId?: string | null
  habitId?: string | null
}): Promise<void> {
  const response = await apiFetch('/api/pomodoro/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(`Failed to create pomodoro session: ${response.status}`)
  }
}
