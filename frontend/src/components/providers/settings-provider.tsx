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

type AnonymousPreferences = Pick<Settings, 'theme' | 'language'>

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function settingsStorageKey(userId: string | null): string {
  return userId ? `settings:${userId}` : 'settings'
}

function anonymousPreferences(snapshot: Settings): AnonymousPreferences {
  return {
    theme: snapshot.theme,
    language: snapshot.language,
  }
}

function readAnonymousPreferences(): Partial<AnonymousPreferences> | null {
  try {
    const raw = localStorage.getItem(settingsStorageKey(null))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      ...(parsed.theme != null ? { theme: parsed.theme } : {}),
      ...(parsed.language != null ? { language: parsed.language } : {}),
    }
  } catch {
    return null
  }
}

function persistSettingsSnapshot(
  storageKey: string,
  snapshot: Settings,
  options?: { mirrorAnonymousPreferences?: boolean },
): void {
  try {
    const anonymousKey = settingsStorageKey(null)
    if (storageKey === anonymousKey) {
      localStorage.setItem(anonymousKey, JSON.stringify(anonymousPreferences(snapshot)))
      return
    }

    localStorage.setItem(storageKey, JSON.stringify(snapshot))
    if (options?.mirrorAnonymousPreferences) {
      localStorage.setItem(anonymousKey, JSON.stringify(anonymousPreferences(snapshot)))
    }
  } catch {
    // Ignore localStorage errors; backend remains authoritative for signed-in users.
  }
}

function handleAuthFailure(): void {
  emitSessionExpired()
}

interface SettingsProviderProps {
  children: React.ReactNode
  initialLocale: Settings['language']
  authScope?: {
    ready: boolean
    userId: string | null
  }
}

export function SettingsProvider({ children, initialLocale, authScope }: SettingsProviderProps) {
  const { t } = useI18n()
  const { i18n } = useTranslation()
  const authReady = authScope?.ready ?? true
  const userId = authScope?.userId ?? null
  const storageKey = settingsStorageKey(userId)
  const canUseBackend = authScope
    ? authScope.ready && userId !== null
    : typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true'

  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    language: initialLocale,
  }))
  const [hydrated, setHydrated] = useState(false)
  const initialLocaleRef = useRef(initialLocale)
  const settingsDirtyAtRef = useRef(0)

  const applyLanguage = useCallback(
    async (language: Settings['language']) => {
      setLocaleCookie(language)
      if (i18n.language !== language) await i18n.changeLanguage(language)
    },
    [i18n],
  )

  useEffect(() => {
    let cancelled = false

    const hydrateFromStorage = async () => {
      if (!authReady) return
      setHydrated(false)

      let nextSettings: Settings = {
        ...DEFAULT_SETTINGS,
        language: initialLocaleRef.current,
      }

      if (userId) {
        const savedSettings = localStorage.getItem(storageKey)
        if (savedSettings) {
          try {
            nextSettings = mapSettingsFromApi(JSON.parse(savedSettings) as Settings, nextSettings)
          } catch (error) {
            console.error(t('console.failedParseSettings'), error)
            localStorage.removeItem(storageKey)
          }
        } else {
          // A signed-in account never inherits another account's notification,
          // navigation, default list, or other account-scoped preferences.
          // Guest theme/language may be used briefly until the backend snapshot loads.
          const guestPreferences = readAnonymousPreferences()
          if (guestPreferences?.theme) nextSettings.theme = guestPreferences.theme
          if (guestPreferences?.language) nextSettings.language = guestPreferences.language
        }
      } else {
        const guestPreferences = readAnonymousPreferences()
        if (guestPreferences?.theme) nextSettings.theme = guestPreferences.theme
        if (guestPreferences?.language) nextSettings.language = guestPreferences.language
      }

      if (nextSettings.language !== initialLocaleRef.current) {
        await applyLanguage(nextSettings.language)
      }

      if (!cancelled) {
        setSettings(nextSettings)
        setHydrated(true)
        persistSettingsSnapshot(storageKey, nextSettings, {
          mirrorAnonymousPreferences: Boolean(userId),
        })
      }
    }

    void hydrateFromStorage()
    return () => {
      cancelled = true
    }
  }, [applyLanguage, authReady, storageKey, t, userId])

  useEffect(() => {
    let isMounted = true
    const loadStartedAt = Date.now()

    const loadFromBackend = async () => {
      if (typeof window === 'undefined' || !canUseBackend) return

      try {
        const data = await settingsApi.fetchSettings()
        if (!isMounted || data == null) return
        if (settingsDirtyAtRef.current >= loadStartedAt) return

        let mergedLanguage: Settings['language'] | undefined
        setSettings((previous) => {
          const merged = mapSettingsFromApi(data, previous)
          mergedLanguage = merged.language
          persistSettingsSnapshot(storageKey, merged, {
            mirrorAnonymousPreferences: Boolean(userId),
          })
          return merged
        })

        if (mergedLanguage) await applyLanguage(mergedLanguage)
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
  }, [applyLanguage, canUseBackend, storageKey, userId])

  const persistToBackend = useCallback(
    (payload: Partial<Settings>) => {
      if (typeof window === 'undefined' || !canUseBackend) return

      void settingsApi.updateSettings(payload).catch((error) => {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          handleAuthFailure()
          return
        }
        console.error('Failed to persist settings to backend', error)
      })
    },
    [canUseBackend],
  )

  const updateSettings = useCallback(
    (updates: Partial<Settings>) => {
      settingsDirtyAtRef.current = Date.now()
      setSettings((previous) => {
        const updated = { ...previous, ...updates }
        if (typeof window !== 'undefined') {
          persistSettingsSnapshot(storageKey, updated, {
            mirrorAnonymousPreferences: Boolean(userId),
          })
        }
        return updated
      })
      persistToBackend(updates)
      if (updates.language) void applyLanguage(updates.language)
    },
    [applyLanguage, persistToBackend, storageKey, userId],
  )

  const resetSettings = useCallback(() => {
    settingsDirtyAtRef.current = Date.now()
    setSettings(DEFAULT_SETTINGS)

    if (typeof window !== 'undefined') {
      persistSettingsSnapshot(storageKey, DEFAULT_SETTINGS, {
        mirrorAnonymousPreferences: Boolean(userId),
      })
    }

    void applyLanguage(DEFAULT_SETTINGS.language)
    persistToBackend(DEFAULT_SETTINGS)
  }, [applyLanguage, persistToBackend, storageKey, userId])

  const setTheme = useCallback(
    (theme: Settings['theme']) => updateSettings({ theme }),
    [updateSettings],
  )

  const setLanguage = useCallback(
    (language: Settings['language']) => updateSettings({ language }),
    [updateSettings],
  )

  const setBottomNavActions = useCallback(
    (bottomNavActions: Settings['bottomNavActions']) => updateSettings({ bottomNavActions }),
    [updateSettings],
  )

  return (
    <SettingsContext.Provider
      value={{
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
      }}
    >
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
