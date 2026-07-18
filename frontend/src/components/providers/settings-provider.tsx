'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useI18n } from '@/lib/i18n/hooks'
import { ApiError } from '@/lib/api/client'
import { emitSessionExpired } from '@/lib/auth/session-events'
import * as settingsApi from '@/lib/api/settings'
import { mapSettingsFromApi } from '@/lib/api/settings'
import { setLocaleCookie } from '@/lib/i18n/locale-cookie'
import type { Settings } from '@/types'

interface SettingsContextType {
  settings: Settings
  hydrated: boolean
  updateSettings: (updates: Partial<Settings>) => void
  resetSettings: () => void
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

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

function handleAuthFailure(): void {
  emitSessionExpired()
}

interface SettingsProviderProps {
  children: React.ReactNode
  initialLocale: Settings['language']
}

export function SettingsProvider({ children, initialLocale }: SettingsProviderProps) {
  const { t } = useI18n()
  const { i18n } = useTranslation()
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    language: initialLocale,
  }))
  const [hydrated, setHydrated] = useState(false)
  const initialLocaleRef = useRef(initialLocale)
  const settingsDirtyAtRef = useRef(0)

  const applyLanguage = useCallback(async (language: Settings['language']) => {
    setLocaleCookie(language)
    if (i18n.language !== language) {
      await i18n.changeLanguage(language)
    }
  }, [i18n])

  useEffect(() => {
    let cancelled = false

    const hydrateFromStorage = async () => {
      let nextSettings: Settings = {
        ...DEFAULT_SETTINGS,
        language: initialLocaleRef.current,
      }
      const savedSettings = localStorage.getItem('settings')

      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings) as Settings
          nextSettings = mapSettingsFromApi(parsed, nextSettings)
          try {
            localStorage.setItem('settings', JSON.stringify(nextSettings))
          } catch {
            // ignore localStorage errors
          }
        } catch (error) {
          console.error(t('console.failedParseSettings'), error)
          localStorage.removeItem('settings')
        }
      }

      if (nextSettings.language !== initialLocaleRef.current) {
        await applyLanguage(nextSettings.language)
      }

      if (!cancelled) {
        setSettings(nextSettings)
        setHydrated(true)
      }
    }

    void hydrateFromStorage()

    return () => {
      cancelled = true
    }
  }, [applyLanguage, t])

  useEffect(() => {
    let isMounted = true
    const loadStartedAt = Date.now()

    const loadFromBackend = async () => {
      if (typeof window === 'undefined') return
      if (localStorage.getItem('isAuthenticated') !== 'true') return

      try {
        const data = await settingsApi.fetchSettings()
        if (!isMounted || data == null) return
        // Ignore stale fetch if user already changed settings locally
        if (settingsDirtyAtRef.current > loadStartedAt) return

        let mergedLanguage: Settings['language'] | undefined

        setSettings((prev) => {
          const merged = mapSettingsFromApi(data, prev)
          mergedLanguage = merged.language
          try {
            localStorage.setItem('settings', JSON.stringify(merged))
          } catch {
            // ignore localStorage errors
          }
          return merged
        })

        if (mergedLanguage) {
          await applyLanguage(mergedLanguage)
        }
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          handleAuthFailure()
          return
        }
        console.error('Failed to load settings from backend', error)
      }
    }

    void loadFromBackend()

    return () => {
      isMounted = false
    }
  }, [applyLanguage])

  const persistToBackend = useCallback((payload: Partial<Settings>) => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('isAuthenticated') !== 'true') return

    void settingsApi.updateSettings(payload).catch((error) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        handleAuthFailure()
        return
      }
      console.error('Failed to persist settings to backend', error)
    })
  }, [])

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    settingsDirtyAtRef.current = Date.now()
    setSettings((prev) => {
      const updated = { ...prev, ...updates }

      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('settings', JSON.stringify(updated))
        }
      } catch {
        // ignore localStorage errors
      }

      persistToBackend(updated)
      return updated
    })

    if (updates.language) {
      void applyLanguage(updates.language)
    }
  }, [applyLanguage, persistToBackend])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('settings', JSON.stringify(DEFAULT_SETTINGS))
      }
    } catch {
      // ignore localStorage errors
    }

    void applyLanguage(DEFAULT_SETTINGS.language)
    persistToBackend(DEFAULT_SETTINGS)
  }, [applyLanguage, persistToBackend])

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
      hydrated,
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
