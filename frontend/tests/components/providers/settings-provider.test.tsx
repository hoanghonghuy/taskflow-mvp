import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SettingsProvider,
  settingsStorageKey,
  useSettings,
} from '@/components/providers/settings-provider'
import { I18nProvider } from '@/components/providers/i18n-provider'
import { createLocalStorageMock } from '../../helpers/test-utils'

function SettingsTestWrapper({ children }: { children: ReactNode }) {
  return (
    <I18nProvider initialLocale="en">
      <SettingsProvider initialLocale="en">{children}</SettingsProvider>
    </I18nProvider>
  )
}

function SettingsThemeProbe() {
  const { theme, hydrated } = useSettings()
  return <span>{hydrated ? theme : 'loading'}</span>
}

describe('SettingsProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock())
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response)
    )
  })

  it('throws when useSettings is used outside provider', () => {
    expect(() => renderHook(() => useSettings())).toThrow(
      'useSettings must be used within SettingsProvider'
    )
  })

  it('isolates cached settings by user id', () => {
    expect(settingsStorageKey('user-a')).toBe('settings:user-a')
    expect(settingsStorageKey('user-b')).toBe('settings:user-b')
    expect(settingsStorageKey(null)).toBe('settings')
  })

  it('rehydrates from the next user cache when account changes in the same tab', async () => {
    const userASettings = { language: 'en', theme: 'dark' }
    const userBSettings = { language: 'en', theme: 'light' }
    localStorage.setItem('settings', JSON.stringify(userASettings))
    localStorage.setItem(settingsStorageKey('user-a'), JSON.stringify(userASettings))
    localStorage.setItem(settingsStorageKey('user-b'), JSON.stringify(userBSettings))

    const { rerender } = render(
      <I18nProvider initialLocale="en">
        <SettingsProvider
          initialLocale="en"
          authScope={{ ready: true, userId: 'user-a' }}
        >
          <SettingsThemeProbe />
        </SettingsProvider>
      </I18nProvider>,
    )

    await waitFor(() => expect(screen.getByText('dark')).toBeInTheDocument())

    rerender(
      <I18nProvider initialLocale="en">
        <SettingsProvider
          initialLocale="en"
          authScope={{ ready: true, userId: 'user-b' }}
        >
          <SettingsThemeProbe />
        </SettingsProvider>
      </I18nProvider>,
    )

    await waitFor(() => expect(screen.getByText('light')).toBeInTheDocument())
  })

  it('migrates anonymous settings into the user cache on login so theme does not reset to light', async () => {
    localStorage.setItem(
      'settings',
      JSON.stringify({ language: 'en', theme: 'dark', notifications: false }),
    )

    const { rerender } = render(
      <I18nProvider initialLocale="en">
        <SettingsProvider
          initialLocale="en"
          authScope={{ ready: true, userId: null }}
        >
          <SettingsThemeProbe />
        </SettingsProvider>
      </I18nProvider>,
    )

    await waitFor(() => expect(screen.getByText('dark')).toBeInTheDocument())

    rerender(
      <I18nProvider initialLocale="en">
        <SettingsProvider
          initialLocale="en"
          authScope={{ ready: true, userId: 'user-login' }}
        >
          <SettingsThemeProbe />
        </SettingsProvider>
      </I18nProvider>,
    )

    await waitFor(() => expect(screen.getByText('dark')).toBeInTheDocument())
    expect(JSON.parse(localStorage.getItem(settingsStorageKey('user-login'))!)).toMatchObject({
      theme: 'dark',
      notifications: false,
    })
  })

  it('keeps migrated theme when backend still returns the light default', async () => {
    localStorage.setItem('settings', JSON.stringify({ language: 'en', theme: 'dark' }))
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.includes('/api/settings') && (!init || init.method === 'GET' || init.method === undefined)) {
        return {
          ok: true,
          json: async () => ({ language: 'en', theme: 'light' }),
        } as Response
      }
      return { ok: true, json: async () => ({}) } as Response
    })

    render(
      <I18nProvider initialLocale="en">
        <SettingsProvider
          initialLocale="en"
          authScope={{ ready: true, userId: 'user-login' }}
        >
          <SettingsThemeProbe />
        </SettingsProvider>
      </I18nProvider>,
    )

    await waitFor(() => expect(screen.getByText('dark')).toBeInTheDocument())
    // Give the backend fetch a chance to race; migrated local must win.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })
    expect(screen.getByText('dark')).toBeInTheDocument()
  })

  it('changing language does not rewrite other users settings caches', async () => {
    localStorage.setItem(
      settingsStorageKey('user-a'),
      JSON.stringify({ language: 'en', theme: 'dark' }),
    )
    localStorage.setItem(
      settingsStorageKey('user-b'),
      JSON.stringify({ language: 'en', theme: 'light' }),
    )

    const wrapper = ({ children }: { children: ReactNode }) => (
      <I18nProvider initialLocale="en">
        <SettingsProvider
          initialLocale="en"
          authScope={{ ready: true, userId: 'user-a' }}
        >
          {children}
        </SettingsProvider>
      </I18nProvider>
    )

    const { result } = renderHook(() => useSettings(), { wrapper })
    await waitFor(() => expect(result.current.hydrated).toBe(true))

    act(() => {
      result.current.setLanguage('vi')
    })

    await waitFor(() => expect(result.current.language).toBe('vi'))
    expect(JSON.parse(localStorage.getItem(settingsStorageKey('user-b'))!)).toMatchObject({
      language: 'en',
      theme: 'light',
    })
  })

  it('mirrors authenticated settings to anonymous cache so logout keeps theme', async () => {
    let authScope = { ready: true, userId: 'user-a' as string | null }
    const wrapper = ({ children }: { children: ReactNode }) => (
      <I18nProvider initialLocale="en">
        <SettingsProvider initialLocale="en" authScope={authScope}>
          {children}
        </SettingsProvider>
      </I18nProvider>
    )

    const { result, rerender } = renderHook(() => useSettings(), { wrapper })

    await waitFor(() => expect(result.current.hydrated).toBe(true))

    act(() => {
      result.current.setTheme('dark')
    })

    expect(JSON.parse(localStorage.getItem(settingsStorageKey('user-a'))!)).toMatchObject({
      theme: 'dark',
    })
    expect(JSON.parse(localStorage.getItem('settings')!)).toMatchObject({
      theme: 'dark',
    })

    authScope = { ready: true, userId: null }
    rerender()

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true)
      expect(result.current.theme).toBe('dark')
    })
  })

  it('on login from guest overlays anonymous theme onto existing user cache', async () => {
    localStorage.setItem(
      settingsStorageKey('user-a'),
      JSON.stringify({ language: 'en', theme: 'light', notifications: true }),
    )
    localStorage.setItem(
      'settings',
      JSON.stringify({ language: 'en', theme: 'dark', notifications: false }),
    )

    const { rerender } = render(
      <I18nProvider initialLocale="en">
        <SettingsProvider
          initialLocale="en"
          authScope={{ ready: true, userId: null }}
        >
          <SettingsThemeProbe />
        </SettingsProvider>
      </I18nProvider>,
    )

    await waitFor(() => expect(screen.getByText('dark')).toBeInTheDocument())

    rerender(
      <I18nProvider initialLocale="en">
        <SettingsProvider
          initialLocale="en"
          authScope={{ ready: true, userId: 'user-a' }}
        >
          <SettingsThemeProbe />
        </SettingsProvider>
      </I18nProvider>,
    )

    await waitFor(() => expect(screen.getByText('dark')).toBeInTheDocument())
    expect(JSON.parse(localStorage.getItem(settingsStorageKey('user-a'))!)).toMatchObject({
      theme: 'dark',
      // account-specific prefs stay from user cache
      notifications: true,
    })
  })

  it('does not overlay anonymous theme when switching accounts', async () => {
    localStorage.setItem('settings', JSON.stringify({ language: 'en', theme: 'dark' }))
    localStorage.setItem(
      settingsStorageKey('user-a'),
      JSON.stringify({ language: 'en', theme: 'dark' }),
    )
    localStorage.setItem(
      settingsStorageKey('user-b'),
      JSON.stringify({ language: 'en', theme: 'light' }),
    )

    const { rerender } = render(
      <I18nProvider initialLocale="en">
        <SettingsProvider
          initialLocale="en"
          authScope={{ ready: true, userId: 'user-a' }}
        >
          <SettingsThemeProbe />
        </SettingsProvider>
      </I18nProvider>,
    )

    await waitFor(() => expect(screen.getByText('dark')).toBeInTheDocument())

    rerender(
      <I18nProvider initialLocale="en">
        <SettingsProvider
          initialLocale="en"
          authScope={{ ready: true, userId: 'user-b' }}
        >
          <SettingsThemeProbe />
        </SettingsProvider>
      </I18nProvider>,
    )

    await waitFor(() => expect(screen.getByText('light')).toBeInTheDocument())
  })

  it('provides default settings', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsTestWrapper })

    expect(result.current.settings.language).toBe('en')
    expect(result.current.settings.theme).toBe('light')
    expect(result.current.theme).toBe('light')

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true)
    })
  })

  it('loads settings from localStorage after mount', async () => {
    const saved = {
      language: 'vi',
      theme: 'dark',
      notifications: false,
      soundEnabled: true,
      autoStartPomodoro: true,
      defaultPriority: 'high',
      defaultListId: 'work',
      bottomNavActions: ['dashboard', 'list'],
      geminiApiKey: 'key',
      boardColumns: [{ id: 'stale-column', name: 'Stale', listId: 'inbox' }],
    }
    localStorage.setItem('settings', JSON.stringify(saved))

    const { result } = renderHook(() => useSettings(), { wrapper: SettingsTestWrapper })

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true)
      expect(result.current.settings.language).toBe('vi')
      expect(result.current.settings.theme).toBe('dark')
      expect((result.current.settings as unknown as Record<string, unknown>).geminiApiKey).toBeUndefined()
      expect((result.current.settings as unknown as Record<string, unknown>).boardColumns).toBeUndefined()
      expect(JSON.parse(localStorage.getItem('settings')!)).not.toHaveProperty('geminiApiKey')
      expect(JSON.parse(localStorage.getItem('settings')!)).not.toHaveProperty('boardColumns')
    })
  })

  it('updateSettings merges and persists to localStorage without API when unauthenticated', async () => {
    const fetchMock = vi.mocked(fetch)
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsTestWrapper })

    act(() => {
      result.current.updateSettings({ language: 'vi', theme: 'dark' })
    })

    expect(result.current.settings.language).toBe('vi')
    expect(result.current.settings.theme).toBe('dark')
    expect(JSON.parse(localStorage.getItem('settings')!)).toMatchObject({
      language: 'vi',
      theme: 'dark',
    })

    await waitFor(() => {
      expect(fetchMock).not.toHaveBeenCalledWith(
        '/api/settings',
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  it('updateSettings persists to backend when authenticated', async () => {
    localStorage.setItem('isAuthenticated', 'true')
    const fetchMock = vi.mocked(fetch)
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsTestWrapper })

    act(() => {
      result.current.updateSettings({ language: 'vi', theme: 'dark' })
    })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/settings',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ language: 'vi', theme: 'dark' }),
        })
      )
    })
  })

  it('setTheme and setLanguage update settings', () => {
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsTestWrapper })

    act(() => {
      result.current.setTheme('dark')
      result.current.setLanguage('vi')
    })

    expect(result.current.theme).toBe('dark')
    expect(result.current.language).toBe('vi')
  })

  it('resetSettings restores defaults', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsTestWrapper })

    act(() => {
      result.current.updateSettings({ language: 'vi', theme: 'dark' })
    })

    act(() => {
      result.current.resetSettings()
    })

    expect(result.current.settings.language).toBe('en')
    expect(result.current.settings.theme).toBe('light')
  })

  it('loads settings from backend when authenticated', async () => {
    localStorage.setItem('isAuthenticated', 'true')
    const backendSettings = { language: 'vi', theme: 'dark', geminiApiKey: 'server-secret' }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => backendSettings,
    } as Response)

    const { result } = renderHook(() => useSettings(), { wrapper: SettingsTestWrapper })

    await waitFor(() => {
      expect(result.current.settings.language).toBe('vi')
      expect(result.current.settings.theme).toBe('dark')
      expect((result.current.settings as unknown as Record<string, unknown>).geminiApiKey).toBeUndefined()
    })
  })
})
