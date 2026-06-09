import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsProvider, useSettings } from '@/components/providers/settings-provider'
import { I18nProvider } from '@/components/providers/i18n-provider'
import { createLocalStorageMock } from '../../helpers/test-utils'

function SettingsTestWrapper({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <SettingsProvider>{children}</SettingsProvider>
    </I18nProvider>
  )
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

  it('provides default settings', () => {
    const { result } = renderHook(() => useSettings(), { wrapper: SettingsTestWrapper })

    expect(result.current.settings.language).toBe('en')
    expect(result.current.settings.theme).toBe('light')
    expect(result.current.theme).toBe('light')
  })

  it('loads settings from localStorage', () => {
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
    }
    localStorage.setItem('settings', JSON.stringify(saved))

    const { result } = renderHook(() => useSettings(), { wrapper: SettingsTestWrapper })

    expect(result.current.settings.language).toBe('vi')
    expect(result.current.settings.theme).toBe('dark')
    expect((result.current.settings as unknown as Record<string, unknown>).geminiApiKey).toBeUndefined()
    expect(JSON.parse(localStorage.getItem('settings')!)).not.toHaveProperty('geminiApiKey')
  })

  it('updateSettings merges and persists to localStorage', async () => {
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
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/settings',
        expect.objectContaining({ method: 'PUT' })
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
