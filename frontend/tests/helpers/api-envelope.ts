export function unwrapEnvelope<T>(body: unknown): T {
  if (body && typeof body === 'object' && (body as { success?: boolean }).success === true && 'data' in body) {
    return (body as { data: T }).data
  }
  return body as T
}
