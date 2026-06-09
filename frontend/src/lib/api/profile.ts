import { apiFetch } from './client'

export async function fetchAchievements(): Promise<string[]> {
  const response = await apiFetch('/api/profile/achievements')
  if (!response.ok) return []
  const json = await response.json().catch(() => null)
  if (!Array.isArray(json)) return []
  return json.filter((id): id is string => typeof id === 'string')
}

export async function fetchProfileSummary(): Promise<Record<string, unknown> | null> {
  const response = await apiFetch('/api/profile/summary', { method: 'GET' })
  if (!response.ok) return null
  return response.json().catch(() => null)
}
