import type { FocusSession, PomodoroState } from '@/types'
import { apiFetch, unwrapApiData } from './client'
import { mapFocusSessionsFromApi, mapPomodoroStateFromApi, pomodoroStateToApiPayload } from './mappers'

export async function fetchPomodoroSessions(): Promise<FocusSession[]> {
  const response = await apiFetch('/api/pomodoro/sessions')
  if (!response.ok) return []
  const raw = await response.json().catch(() => null)
  const json = raw ? unwrapApiData<unknown>(raw, response.status) : null
  return Array.isArray(json) ? mapFocusSessionsFromApi(json) : []
}

export async function fetchPomodoroState(
  fallback: PomodoroState,
): Promise<Partial<PomodoroState> | null> {
  const response = await apiFetch('/api/pomodoro/state')
  if (!response.ok || response.status === 204) return null
  const raw = await response.json().catch(() => null)
  const json = raw ? unwrapApiData<unknown>(raw, response.status) : null
  return mapPomodoroStateFromApi(json, fallback)
}

export async function updatePomodoroState(
  state: PomodoroState,
  options?: { keepalive?: boolean },
): Promise<void> {
  await apiFetch('/api/pomodoro/state', {
    method: 'PUT',
    body: JSON.stringify(pomodoroStateToApiPayload(state)),
    keepalive: options?.keepalive,
  })
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
