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
    <I18nProvider>
      <UserProvider>{children}</UserProvider>
    </I18nProvider>
  )
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

  it('starts unauthenticated without saved user', () => {
    const { result } = renderHook(() => useUser(), { wrapper: UserTestWrapper })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.allUsers.length).toBeGreaterThan(0)
  })

  it('restores user from localStorage', () => {
    localStorage.setItem('user', JSON.stringify(mockUser))

    const { result } = renderHook(() => useUser(), { wrapper: UserTestWrapper })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('login stores user and clears taskflowState', async () => {
    localStorage.setItem('taskflowState', '{}')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    } as Response)

    const { result } = renderHook(() => useUser(), { wrapper: UserTestWrapper })

    await act(async () => {
      await result.current.login('alex.ryder@example.com', 'password')
    })

    expect(result.current.user).toEqual(mockUser)
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
    expect(localStorage.getItem('isAuthenticated')).toBe('true')
    expect(localStorage.getItem('taskflowState')).toBeNull()
  })

  it('login throws when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 401 } as Response)

    const { result } = renderHook(() => useUser(), { wrapper: UserTestWrapper })

    await expect(result.current.login('bad@example.com', 'wrong')).rejects.toThrow(
      'Login failed with status 401'
    )
  })

  it('logout clears user and localStorage', async () => {
    localStorage.setItem('user', JSON.stringify(mockUser))
    localStorage.setItem('isAuthenticated', 'true')
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response)

    const { result } = renderHook(() => useUser(), { wrapper: UserTestWrapper })

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('isAuthenticated')).toBeNull()
  })

  it('updateProfile merges updates and persists', () => {
    localStorage.setItem('user', JSON.stringify(mockUser))

    const { result } = renderHook(() => useUser(), { wrapper: UserTestWrapper })

    act(() => {
      result.current.updateProfile({ name: 'Updated Name' })
    })

    expect(result.current.user?.name).toBe('Updated Name')
    expect(JSON.parse(localStorage.getItem('user')!)).toMatchObject({ name: 'Updated Name' })
  })

  it('register calls login after successful registration', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      } as Response)

    const { result } = renderHook(() => useUser(), { wrapper: UserTestWrapper })

    await act(async () => {
      await result.current.register('New User', 'new@example.com', 'secret')
    })

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })
  })
})
