export function parseJsonArray<T>(value: string | null | undefined, fallback: T[] = []): T[] {
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? (parsed as T[]) : fallback
  } catch (error) {
    // Ở dev/test, log warning để phát hiện dữ liệu DB hỏng (legacy migration,
    // user tự edit field, v.v.) thay vì nuốt im lặng → user mất data không biết.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[json] parseJsonArray: invalid JSON, returning fallback',
        { length: value.length, error: error instanceof Error ? error.message : String(error) },
      )
    }
    return fallback
  }
}

export function parseJsonObject<T extends object>(
  value: string | null | undefined,
  fallback: T | null = null,
): T | null {
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as T) : fallback
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[json] parseJsonObject: invalid JSON, returning fallback',
        { length: value.length, error: error instanceof Error ? error.message : String(error) },
      )
    }
    return fallback
  }
}

export function toJsonString(value: unknown): string {
  return JSON.stringify(value ?? null)
}
