import type { List } from '@/types'
import { apiFetch, apiFetchJson } from './client'
import { mapListsFromApi } from './mappers'

export async function fetchLists(): Promise<List[]> {
  const json = await apiFetchJson<unknown[]>('/api/lists')
  return Array.isArray(json) ? mapListsFromApi(json) : []
}

export async function createList(payload: Omit<List, 'id'>): Promise<List | null> {
  const json = await apiFetchJson<unknown>('/api/lists', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      color: payload.color,
      members: payload.members ?? [],
    }),
  })
  return mapListsFromApi([json])[0] ?? null
}

export async function updateList(list: List): Promise<List | null> {
  const json = await apiFetchJson<unknown>(`/api/lists/${encodeURIComponent(list.id)}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: list.name,
      color: list.color,
      members: list.members ?? [],
    }),
  })
  return mapListsFromApi([json])[0] ?? null
}

export async function deleteList(id: string): Promise<void> {
  const response = await apiFetch(`/api/lists/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (response.status === 404) return
  if (!response.ok) {
    throw new Error(`Failed to delete list: ${response.status}`)
  }
}
