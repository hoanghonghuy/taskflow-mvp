import type { Habit } from '@/types'
import { apiFetch, apiFetchJson } from './client'
import { mapHabitsFromApi } from './mappers'

export async function fetchHabits(): Promise<Habit[]> {
  const json = await apiFetchJson<unknown[]>('/api/habits')
  return Array.isArray(json) ? mapHabitsFromApi(json) : []
}

export async function createHabit(name: string): Promise<Habit | null> {
  const json = await apiFetchJson<unknown>('/api/habits', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  return mapHabitsFromApi([json])[0] ?? null
}

export async function updateHabit(habit: Habit): Promise<Habit | null> {
  const json = await apiFetchJson<unknown>(`/api/habits/${encodeURIComponent(habit.id)}`, {
    method: 'PUT',
    body: JSON.stringify({ name: habit.name }),
  })
  return mapHabitsFromApi([json])[0] ?? null
}

export async function completeHabit(id: string, date: string): Promise<void> {
  const response = await apiFetch(`/api/habits/${encodeURIComponent(id)}/complete`, {
    method: 'POST',
    body: JSON.stringify({ date }),
  })
  if (!response.ok) {
    throw new Error(`Failed to complete habit: ${response.status}`)
  }
}

export async function uncompleteHabit(id: string, date: string): Promise<void> {
  const response = await apiFetch(
    `/api/habits/${encodeURIComponent(id)}/complete?date=${encodeURIComponent(date)}`,
    { method: 'DELETE' },
  )
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to uncomplete habit: ${response.status}`)
  }
}

export async function deleteHabit(id: string): Promise<void> {
  const response = await apiFetch(`/api/habits/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete habit: ${response.status}`)
  }
}
