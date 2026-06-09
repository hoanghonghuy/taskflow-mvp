import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserProvider, useUser } from '@/components/providers/user-provider'
import { I18nProvider } from '@/components/providers/i18n-provider'
import { createLocalStorageMock } from '../../helpers/test-utils'

const mockUser = {
  id: 'user-001',
  name: 'Alex Ryder',
  email: 'alex.ryder@example.com',
  avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Alex%20Ryder',
}

function UserTestWrapper({ children }: { children: ReactNode }) {
  return (
    <I18nProvider initialLocale="en">
      <UserProvider>{children}</UserProvider>
    </I18nProvider>
  )
}

function mockSession(authenticated: boolean) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ authenticated }),
  } as Response)
}

describe('UserProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock())
    vi.stubGlobal('fetch', vi.fn())
  })

  it('throws when useUser is used outside provider', () => {
    expect(() => renderHook(() => useUser())).toThrow(
      'useUser must be used within UserProvider'
    )
  })

  it('starts unauthenticated without saved user', async () => {
    mockSession(false)

    const { result } = renderHook(() => useUser(), { wrapper: UserTestWrapper })

    await waitFor(() => {
      expect(result.current.authReady).toBe(true)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.allUsers).toEqual([])
  })

  it('restores user from localStorage only when session is valid', async () => {
    localStorage.setItem('user', JSON.stringify(mockUser))
    mockSession(true)

    const { result } = renderHook(() => useUser(), { wrapper: UserTestWrapper })

    await waitFor(() => {
      expect(result.current.authReady).toBe(true)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('clears stale localStorage user when session is invalid', async () => {
    localStorage.setItem('user', JSON.stringify(mockUser))
    mockSession(false)

    const { result } = renderHook(() => useUser(), { wrapper: UserTestWrapper })

    await waitFor(() => {
      expect(result.current.authReady).toBe(true)
    })

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('login stores user and clears taskflowState', async () => {
    mockSession(false)
    localStorage.setItem('taskflowState', '{}')

    const { result } = renderHook(() => useUser(), { wrapper: UserTestWrapper })

    await waitFor(() => {
      expect(result.current.authReady).toBe(true)
    })

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    } as Response)

    await act(async () => {
      await result.current.login('alex.ryder@example.com', 'password')
    })

    expect(result.current.user).toEqual(mockUser)
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
    expect(localStorage.getItem('isAuthenticated')).toBe('true')
    expect(localStorage.getItem('taskflowState')).toBeNull()
  })

  it('login throws when response is not ok', async () => {
    mockSession(false)

    const { result } = renderHook(() => useUser(), { wrapper: UserTestWrapper })

    await waitFor(() => {
      expect(result.current.authReady).toBe(true)
    })

    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 401 } as Response)

    await expect(result.current.login('bad@example.com', 'wrong')).rejects.toThrow(
      'Login failed with status 401'
    )
  })

  it('logout clears user state', async () => {
    mockSession(true)
    localStorage.setItem('user', JSON.stringify(mockUser))

    const { result } = renderHook(() => useUser(), { wrapper: UserTestWrapper })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('isAuthenticated')).toBeNull()
  })
})
