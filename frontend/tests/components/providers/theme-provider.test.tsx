import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsProvider } from '@/components/providers/settings-provider'
import { ThemeProvider, useTheme } from '@/components/providers/theme-provider'
import { I18nProvider } from '@/components/providers/i18n-provider'
import { createLocalStorageMock, mockMatchMedia } from '../../helpers/test-utils'

function ThemeTestWrapper({ children }: { children: ReactNode }) {
  return (
    <I18nProvider initialLocale="en">
      <SettingsProvider initialLocale="en">
        <ThemeProvider>{children}</ThemeProvider>
      </SettingsProvider>
    </I18nProvider>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock())
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response)
    )
    mockMatchMedia(false)
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    document.body.className = ''
    document.body.removeAttribute('data-theme')
  })

  it('throws when useTheme is used outside provider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within ThemeProvider'
    )
  })

  it('exposes theme from settings and applies light classes', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeTestWrapper })

    expect(result.current.theme).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')
    expect(result.current.appliedTheme).toBe('light')
    expect(document.documentElement.classList.contains('theme-light')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('applies dark theme classes when theme changes', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeTestWrapper })

    act(() => {
      result.current.setTheme('dark')
    })

    expect(result.current.appliedTheme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('resolves system theme from matchMedia', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeTestWrapper })

    act(() => {
      result.current.setTheme('system')
    })

    expect(result.current.appliedTheme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
  })
})
