import { describe, expect, it, vi } from 'vitest'
import { emitSessionExpired, onSessionExpired, shouldEmitSessionExpired } from '@/lib/auth/session-events'

describe('session-events', () => {
  it('notifies listeners when session expires', () => {
    const listener = vi.fn()
    const unsubscribe = onSessionExpired(listener)

    emitSessionExpired()
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    emitSessionExpired()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('skips emit for auth endpoints and unauthenticated clients', () => {
    const storage = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value)
        },
        removeItem: (key: string) => {
          storage.delete(key)
        },
        clear: () => {
          storage.clear()
        },
      },
    })

    expect(shouldEmitSessionExpired('/api/auth/session', 401)).toBe(false)
    expect(shouldEmitSessionExpired('/api/auth/[...nextauth]', 401)).toBe(false)
    expect(shouldEmitSessionExpired('/api/settings', 401)).toBe(false)

    storage.set('isAuthenticated', 'true')
    expect(shouldEmitSessionExpired('/api/settings', 401)).toBe(true)
    expect(shouldEmitSessionExpired('/api/settings', 500)).toBe(false)

    vi.unstubAllGlobals()
  })
})
