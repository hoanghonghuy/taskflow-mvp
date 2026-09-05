import { isMockMode, mockBackendFetch } from './mock-backend'

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/$/, '')

export async function backendFetchWithToken(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<Response> {
  if (isMockMode()) {
    return mockBackendFetch(path, init)
  }

  const headers: HeadersInit = {
    ...(init.headers || {}),
    Authorization: `Bearer ${token}`,
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
  })
}

export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (isMockMode()) {
    return mockBackendFetch(path, init)
  }

  return fetch(`${BACKEND_URL}${path}`, init)
}
