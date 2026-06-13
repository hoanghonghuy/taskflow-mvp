import { emitSessionExpired, shouldEmitSessionExpired } from '@/lib/auth/session-events'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: string; message: string }

export function unwrapApiData<T>(body: unknown, status: number): T {
  if (body && typeof body === 'object' && 'success' in body) {
    const envelope = body as ApiEnvelope<T>
    if (envelope.success === false) {
      throw new ApiError(status, envelope.message || envelope.error)
    }
    return envelope.data
  }
  return body as T
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(path, {
    credentials: 'include',
    ...init,
    headers,
  })
}

export async function apiFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init)
  if (response.status === 204) {
    if (!response.ok) {
      if (shouldEmitSessionExpired(path, response.status)) {
        emitSessionExpired()
      }
      throw new ApiError(response.status, `API ${init?.method ?? 'GET'} ${path} failed: ${response.status}`)
    }
    return undefined as T
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    if (shouldEmitSessionExpired(path, response.status)) {
      emitSessionExpired()
    }
    const message =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message?: string }).message)
        : `API ${init?.method ?? 'GET'} ${path} failed: ${response.status}`
    throw new ApiError(response.status, message)
  }

  return unwrapApiData<T>(body, response.status)
}
