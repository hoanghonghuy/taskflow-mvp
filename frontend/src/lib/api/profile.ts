import { apiFetchJson } from './client'

export async function fetchAchievements(): Promise<string[]> {
  const json = await apiFetchJson<unknown>('/api/profile/achievements')
  if (!Array.isArray(json)) return []
  return json.filter((id): id is string => typeof id === 'string')
}

export async function fetchProfileSummary(): Promise<Record<string, unknown> | null> {
  return (await apiFetchJson<Record<string, unknown> | undefined>(
    '/api/profile/summary',
    { method: 'GET' },
  )) ?? null
}
