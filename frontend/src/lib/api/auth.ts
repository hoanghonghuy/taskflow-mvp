import type { User } from '@/types'
import { apiFetch } from './client'

const AUTH_PATH = '/api/auth/[...nextauth]'
const SESSION_PATH = '/api/auth/session'

export type SessionResponse = { authenticated?: boolean } | null

export async function fetchSession(): Promise<{ ok: boolean; data: SessionResponse }> {
  const response = await apiFetch(SESSION_PATH, { method: 'GET' })
  const data = (await response.json().catch(() => null)) as SessionResponse
  return { ok: response.ok, data }
}

export async function login(email: string, password: string): Promise<User> {
  const response = await apiFetch(AUTH_PATH, {
    method: 'POST',
    body: JSON.stringify({ action: 'login', email, password }),
  })

  if (!response.ok) {
    throw new Error(`Login failed with status ${response.status}`)
  }

  const data = (await response.json().catch(() => null)) as { user?: User } | null
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

  const data = (await response.json().catch(() => null)) as { user?: User } | null
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

export async function refreshSession(): Promise<boolean> {
  const response = await apiFetch(AUTH_PATH, {
    method: 'POST',
    body: JSON.stringify({ action: 'refresh' }),
  })
  return response.ok
}
