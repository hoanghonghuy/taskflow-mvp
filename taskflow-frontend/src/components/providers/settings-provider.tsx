'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { Settings } from '@/types'
import i18n from '@/lib/i18n/config'

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
  autoStartPomodoro: false,
  defaultPriority: 'medium',
  defaultListId: 'inbox',
  bottomNavActions: ['dashboard', 'list', 'board', 'calendar'],
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('settings')
      if (savedSettings) {
        try {
          return JSON.parse(savedSettings)
        } catch (error) {
          console.error('Failed to parse saved settings:', error)
          localStorage.removeItem('settings')
        }
      }
    }
    return DEFAULT_SETTINGS
  })

  // Apply theme to html and body elements (matching template)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const html = window.document.documentElement
      const body = window.document.body
      html.classList.remove('light', 'dark')
      body.classList.remove('light', 'dark')
      html.classList.add(settings.theme)
      body.classList.add(settings.theme)
    }
  }, [settings.theme])

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
