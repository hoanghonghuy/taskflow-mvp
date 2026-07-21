import type { User } from '@/types'
import { apiFetch, unwrapApiData } from './client'

const AUTH_PATH = '/api/auth/[...nextauth]'
const SESSION_PATH = '/api/auth/session'

export type SessionResponse = { authenticated?: boolean; user?: User } | null
export type SessionStatus = 'available' | 'expired' | 'unavailable'

export async function fetchSession(): Promise<{
  ok: boolean
  data: SessionResponse
  status: SessionStatus
}> {
  const response = await apiFetch(SESSION_PATH, { method: 'GET' })
  const json = await response.json().catch(() => null)
  const data = json ? (unwrapApiData<SessionResponse>(json, response.status) as SessionResponse) : null
  const status: SessionStatus = response.ok
    ? 'available'
    : response.status === 401
      ? 'expired'
      : 'unavailable'
  return { ok: response.ok, data, status }
}

export async function login(email: string, password: string): Promise<User> {
  const response = await apiFetch(AUTH_PATH, {
    method: 'POST',
    body: JSON.stringify({ action: 'login', email, password }),
  })

  if (!response.ok) {
    throw new Error(`Login failed with status ${response.status}`)
  }

  const json = await response.json().catch(() => null)
  const data = json ? unwrapApiData<{ user?: User }>(json, response.status) : null
  if (data?.user) {
    return data.user
  }

  throw new Error('Login response did not contain user data')
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const response = await apiFetch(AUTH_PATH, {
    method: 'POST',
    body: JSON.stringify({ action: 'register', name, email, password }),
  })

  if (!response.ok) {
    throw new Error(`Register failed with status ${response.status}`)
  }

  const json = await response.json().catch(() => null)
  const data = json ? unwrapApiData<{ user?: User }>(json, response.status) : null
  if (data?.user) {
    return data.user
  }

  throw new Error('Register response did not contain user data')
}

export async function logout(): Promise<void> {
  await apiFetch(AUTH_PATH, {
    method: 'POST',
    body: JSON.stringify({ action: 'logout' }),
  })
}

export type RefreshSessionResult = 'refreshed' | 'expired' | 'unavailable'

export async function refreshSession(): Promise<RefreshSessionResult> {
  const response = await apiFetch(AUTH_PATH, {
    method: 'POST',
    body: JSON.stringify({ action: 'refresh' }),
  })
  if (response.ok) return 'refreshed'
  if (response.status === 400 || response.status === 401) return 'expired'
  return 'unavailable'
}

export async function fetchCurrentUser(): Promise<User | null> {
  const response = await apiFetch('/api/auth/me', { method: 'GET' })
  if (!response.ok) return null
  const json = await response.json().catch(() => null)
  const data = json ? unwrapApiData<User>(json, response.status) : null
  return data ?? null
}

export async function updateCurrentUser(updates: Partial<Pick<User, 'name'>>): Promise<User | null> {
  const response = await apiFetch('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
  if (!response.ok) return null
  const json = await response.json().catch(() => null)
  const data = json ? unwrapApiData<User>(json, response.status) : null
  return data ?? null
}

export async function fetchCollaborators(): Promise<User[]> {
  const response = await apiFetch('/api/auth/collaborators', { method: 'GET' })
  if (!response.ok) return []
  const json = await response.json().catch(() => null)
  const data = json ? unwrapApiData<User[]>(json, response.status) : null
  return Array.isArray(data) ? data : []
}

export async function lookupUserByEmail(email: string): Promise<User | null> {
  const response = await apiFetch(
    `/api/auth/lookup-user?email=${encodeURIComponent(email.trim())}`,
    { method: 'GET' },
  )
  if (response.status === 404) return null
  if (!response.ok) {
    const json = await response.json().catch(() => null)
    const message =
      (json as { message?: string } | null)?.message ??
      `Lookup failed with status ${response.status}`
    throw new Error(message)
  }
  const json = await response.json().catch(() => null)
  const data = json ? unwrapApiData<User>(json, response.status) : null
  return data ?? null
}
