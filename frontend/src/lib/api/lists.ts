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

export async function updateList(
  list: Pick<List, 'id'> & Partial<Pick<List, 'name' | 'color' | 'members'>>,
): Promise<List | null> {
  const body: Record<string, unknown> = {}
  if (list.name !== undefined) body.name = list.name
  if (list.color !== undefined) body.color = list.color
  if (list.members !== undefined) body.members = list.members

  const json = await apiFetchJson<unknown>(`/api/lists/${encodeURIComponent(list.id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return mapListsFromApi([json])[0] ?? null
}

export async function addListMember(listId: string, userId: string): Promise<List | null> {
  const json = await apiFetchJson<unknown>(
    `/api/lists/${encodeURIComponent(listId)}/members`,
    {
      method: 'POST',
      body: JSON.stringify({ userId }),
    },
  )
  return mapListsFromApi([json])[0] ?? null
}

export async function removeListMember(listId: string, userId: string): Promise<List | null> {
  const json = await apiFetchJson<unknown>(
    `/api/lists/${encodeURIComponent(listId)}/members/${encodeURIComponent(userId)}`,
    { method: 'DELETE' },
  )
  return mapListsFromApi([json])[0] ?? null
}

export async function deleteList(id: string): Promise<void> {
  const response = await apiFetch(`/api/lists/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (response.status === 404) return
  if (!response.ok) {
    throw new Error(`Failed to delete list: ${response.status}`)
  }
}
