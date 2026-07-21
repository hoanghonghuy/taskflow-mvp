import type { CountdownEvent } from '@/types'
import { apiFetchJson } from './client'
import { mapCountdownsFromApi } from './mappers'

export async function fetchCountdowns(): Promise<CountdownEvent[]> {
  const json = await apiFetchJson<unknown[]>('/api/countdown')
  return Array.isArray(json) ? mapCountdownsFromApi(json) : []
}

export async function createCountdown(payload: {
  title: string
  targetDate: string
  color?: string
}): Promise<CountdownEvent | null> {
  const json = await apiFetchJson<unknown>('/api/countdown', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return mapCountdownsFromApi([json])[0] ?? null
}

export async function updateCountdown(
  id: string,
  payload: Partial<{ title: string; targetDate: string; color: string }>,
): Promise<CountdownEvent | null> {
  const json = await apiFetchJson<unknown>(`/api/countdown/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return mapCountdownsFromApi([json])[0] ?? null
}

export async function deleteCountdown(id: string): Promise<void> {
  await apiFetchJson(`/api/countdown/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
