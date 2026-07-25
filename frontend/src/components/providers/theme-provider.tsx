'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ThemeOption, ThemePresetId } from '@/types'
import { useSettings } from './settings-provider'
import { THEME_PRESET_IDS, isDarkThemeId } from '@/lib/theme-presets'

interface ThemeContextType {
  theme: ThemeOption
  setTheme: (theme: ThemeOption) => void
  resolvedTheme: 'light' | 'dark'
  appliedTheme: ThemePresetId
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_CLASS_NAMES = THEME_PRESET_IDS.map((id) => `theme-${id}`)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, hydrated } = useSettings()
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const appliedTheme: ThemePresetId = useMemo(() => {
    if (theme === 'system') {
      return systemTheme === 'dark' ? 'dark' : 'light'
    }
    return theme
  }, [systemTheme, theme])

  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    return isDarkThemeId(appliedTheme) ? 'dark' : 'light'
  }, [appliedTheme])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    // Keep last DOM theme classes while settings re-hydrate (e.g. login scope change).
    if (!hydrated) {
      return
    }

    const applyClasses = (element: Element) => {
      element.classList.remove(...THEME_CLASS_NAMES, 'light', 'dark')
      element.classList.add(`theme-${appliedTheme}`)
      if (isDarkThemeId(appliedTheme)) {
        element.classList.add('dark')
      } else {
        element.classList.add('light')
      }
    }

    const root = window.document.documentElement
    const body = window.document.body

    applyClasses(root)
    if (body) {
      applyClasses(body)
    }

    root.setAttribute('data-theme', appliedTheme)
    if (body) {
      body.setAttribute('data-theme', appliedTheme)
    }
  }, [appliedTheme, hydrated])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, appliedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
