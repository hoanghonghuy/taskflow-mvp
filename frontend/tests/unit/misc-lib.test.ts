import { describe, expect, it, vi } from 'vitest'
import { THEME_PRESET_IDS, THEME_PRESET_MAP, isDarkThemeId } from '@/lib/theme-presets'
import { clearTaskflowStorage, hasEmptyState } from '@/lib/utils/clear-storage'
import { isToday } from '@/lib/utils/date-helpers'

describe('theme-presets', () => {
  it('exports preset ids and lookup', () => {
    expect(THEME_PRESET_IDS).toContain('light')
    expect(THEME_PRESET_MAP.dark.id).toBe('dark')
    expect(isDarkThemeId('dark')).toBe(true)
    expect(isDarkThemeId('light')).toBe(false)
  })
})

describe('clear-storage', () => {
  it('no-ops on server', () => {
    expect(hasEmptyState()).toBe(false)
    clearTaskflowStorage()
  })

  it('works with mocked localStorage', () => {
    const store: Record<string, string> = {}
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v },
      removeItem: (k: string) => { delete store[k] },
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)
    expect(hasEmptyState()).toBe(true)
    store.taskflowState = JSON.stringify({ tasks: [{ id: '1' }] })
    expect(hasEmptyState()).toBe(false)
    store.taskflowState = 'bad-json'
    expect(hasEmptyState()).toBe(true)
    clearTaskflowStorage()
    expect(store.taskflowState).toBeUndefined()
    vi.unstubAllGlobals()
  })
})

describe('date-helpers isToday', () => {
  it('detects today date object', () => {
    expect(isToday(new Date())).toBe(true)
  })
})
