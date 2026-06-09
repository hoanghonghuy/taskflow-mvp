'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/hooks'
import type { Settings, ThemeOption } from '@/types'
import i18n from '@/lib/i18n/config'
import { THEME_PRESET_IDS } from '@/lib/theme-presets'

interface SettingsContextType {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
  resetSettings: () => void
  // Direct setters for convenience (matching template API)
  theme: Settings['theme']
  setTheme: (theme: Settings['theme']) => void
  language: Settings['language']
  setLanguage: (language: Settings['language']) => void
  bottomNavActions: Settings['bottomNavActions']
  setBottomNavActions: (actions: Settings['bottomNavActions']) => void
}

const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  theme: 'light',
  notifications: true,
  soundEnabled: false,
  autoStartPomodoro: false,
  defaultPriority: 'medium',
  defaultListId: 'inbox',
  bottomNavActions: ['dashboard', 'list', 'board', 'calendar'],
}

const THEME_OPTIONS_SET = new Set<ThemeOption>(['system', ...THEME_PRESET_IDS])

function mapSettingsFromApi(payload: unknown, fallback: Settings): Settings {
  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  const data = { ...(payload as Partial<Settings> & {
    geminiApiKey?: unknown
  }) }
  delete data.geminiApiKey

  const language = data.language === 'en' || data.language === 'vi' ? data.language : fallback.language
  const theme = ((): Settings['theme'] => {
    const candidate = data.theme as ThemeOption | undefined
    if (candidate && THEME_OPTIONS_SET.has(candidate)) {
      return candidate
    }
    return fallback.theme
  })()

  return {
    ...fallback,
    ...data,
    language,
    theme,
    bottomNavActions: data.bottomNavActions && data.bottomNavActions.length > 0
      ? data.bottomNavActions
      : fallback.bottomNavActions,
  }
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings) as Settings
          const sanitized = mapSettingsFromApi(parsed, DEFAULT_SETTINGS)
          try {
            localStorage.setItem('settings', JSON.stringify(sanitized))
          } catch {
            // ignore localStorage errors
          }
          return sanitized
        } catch (error) {
          console.error(t('console.failedParseSettings'), error)
          localStorage.removeItem('settings')
        }
      }
    }
    return DEFAULT_SETTINGS
  })

  useEffect(() => {
    let isMounted = true

    const loadFromBackend = async () => {
      if (typeof window === 'undefined') return

      const isAuthenticated = window.localStorage.getItem('isAuthenticated') === 'true'
      if (!isAuthenticated) return

      try {
        const response = await fetch('/api/settings', { method: 'GET', credentials: 'include' })
        if (!response.ok) {
          return
        }

        const data = await response.json().catch(() => null)
        if (!isMounted || data == null) return

        setSettings((prev) => {
          const merged = mapSettingsFromApi(data, prev)
          try {
            localStorage.setItem('settings', JSON.stringify(merged))
          } catch {
            // ignore localStorage errors
          }
          return merged
        })
      } catch (error) {
        console.error('Failed to load settings from backend', error)
      }
    }

    void loadFromBackend()

    return () => {
      isMounted = false
    }
  }, [])

  // Sync language changes with i18n outside of setState
  useEffect(() => {
    if (typeof window !== 'undefined' && settings.language) {
      if (i18n.language !== settings.language) {
        i18n.changeLanguage(settings.language)
      }
    }
  }, [settings.language])

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...updates }
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('settings', JSON.stringify(updated))
        }
      } catch {
        // ignore localStorage errors
      }

      if (typeof window !== 'undefined') {
        void fetch('/api/settings', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }).catch((error) => {
          console.error('Failed to persist settings to backend', error)
        })
      }

      return updated
    })
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('settings', JSON.stringify(DEFAULT_SETTINGS))
      }
    } catch {
      // ignore localStorage errors
    }

    if (typeof window !== 'undefined') {
      void fetch('/api/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_SETTINGS),
      }).catch((error) => {
        console.error('Failed to reset settings on backend', error)
      })
    }
  }, [])

  // Direct setters for convenience (matching template API)
  const setTheme = useCallback((theme: Settings['theme']) => {
    updateSettings({ theme })
  }, [updateSettings])

  const setLanguage = useCallback((language: Settings['language']) => {
    updateSettings({ language })
  }, [updateSettings])

  const setBottomNavActions = useCallback((bottomNavActions: Settings['bottomNavActions']) => {
    updateSettings({ bottomNavActions })
  }, [updateSettings])

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      resetSettings,
      theme: settings.theme,
      setTheme,
      language: settings.language,
      setLanguage,
      bottomNavActions: settings.bottomNavActions || DEFAULT_SETTINGS.bottomNavActions,
      setBottomNavActions,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}
