'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useI18n } from '@/lib/hooks/use-i18n'
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

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings) as Settings
          if (!THEME_OPTIONS_SET.has(parsed.theme)) {
            parsed.theme = DEFAULT_SETTINGS.theme
          }
          return parsed
        } catch (error) {
          console.error(t('console.failedParseSettings'), error)
          localStorage.removeItem('settings')
        }
      }
    }
    return DEFAULT_SETTINGS
  })

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
      localStorage.setItem('settings', JSON.stringify(updated))
      return updated
    })
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.setItem('settings', JSON.stringify(DEFAULT_SETTINGS))
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
