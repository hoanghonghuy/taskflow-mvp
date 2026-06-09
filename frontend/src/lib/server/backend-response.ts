export type BackendEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error?: string; message?: string }

export function unwrapBackendPayload<T>(body: T | BackendEnvelope<T> | null): T | null {
  if (!body || typeof body !== 'object') {
    return null
  }

  if ('success' in body) {
    const envelope = body as BackendEnvelope<T>
    return envelope.success ? envelope.data : null
  }

  return body as T
}
