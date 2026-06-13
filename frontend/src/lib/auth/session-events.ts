type SessionExpiredListener = () => void

const listeners = new Set<SessionExpiredListener>()

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitSessionExpired(): void {
  for (const listener of listeners) {
    listener()
  }
}

export function shouldEmitSessionExpired(path: string, status: number): boolean {
  if (status !== 401 && status !== 403) return false
  if (path.includes('/api/auth/session')) return false
  if (path.includes('/api/auth/[...nextauth]')) return false
  if (typeof window !== 'undefined' && window.localStorage.getItem('isAuthenticated') !== 'true') {
    return false
  }
  return true
}
