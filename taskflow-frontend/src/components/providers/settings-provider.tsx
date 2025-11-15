'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { Settings } from '@/types'

interface SettingsContextType {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
  resetSettings: () => void
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

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
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
