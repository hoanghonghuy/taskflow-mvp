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

export function settingsStorageKey(userId: string | null): string {
  return userId ? `settings:${userId}` : 'settings'
}

function persistSettingsSnapshot(
  storageKey: string,
  snapshot: Settings,
  options?: { mirrorAnonymous?: boolean },
): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(snapshot))
    if (options?.mirrorAnonymous && storageKey !== settingsStorageKey(null)) {
      localStorage.setItem(settingsStorageKey(null), JSON.stringify(snapshot))
    }
  } catch {
    // ignore localStorage errors
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
  const previousStorageKeyRef = useRef<string | null>(null)

  const applyLanguage = useCallback(async (language: Settings['language']) => {
    setLocaleCookie(language)
    if (i18n.language !== language) {
      await i18n.changeLanguage(language)
    }
  }, [i18n])

  useEffect(() => {
    let cancelled = false

    const hydrateFromStorage = async () => {
      if (!authReady) return

      setHydrated(false)

      let nextSettings: Settings = {
        ...DEFAULT_SETTINGS,
        language: initialLocaleRef.current,
      }
      const savedSettings = localStorage.getItem(storageKey)
      const previousStorageKey = previousStorageKeyRef.current
      previousStorageKeyRef.current = storageKey
      const isLoginFromGuest =
        Boolean(userId) && previousStorageKey === settingsStorageKey(null)
      let shouldPushBackend = false

      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings) as Settings
          nextSettings = mapSettingsFromApi(parsed, nextSettings)

          if (isLoginFromGuest) {
            const anonymousSettings = localStorage.getItem(settingsStorageKey(null))
            if (anonymousSettings) {
              try {
                const anonymous = JSON.parse(anonymousSettings) as Settings
                const themeChanged =
                  anonymous.theme != null && anonymous.theme !== nextSettings.theme
                const languageChanged =
                  anonymous.language != null && anonymous.language !== nextSettings.language
                if (themeChanged || languageChanged) {
                  nextSettings = {
                    ...nextSettings,
                    ...(themeChanged ? { theme: anonymous.theme } : {}),
                    ...(languageChanged ? { language: anonymous.language } : {}),
                  }
                  shouldPushBackend = true
                  settingsDirtyAtRef.current = Date.now()
                }
              } catch (error) {
                console.error(t('console.failedParseSettings'), error)
              }
            }
          }

          persistSettingsSnapshot(storageKey, nextSettings, {
            mirrorAnonymous: Boolean(userId),
          })
        } catch (error) {
          console.error(t('console.failedParseSettings'), error)
          localStorage.removeItem(storageKey)
        }
      } else if (userId) {
        // Login / first visit for this account: keep anonymous pre-auth preferences
        // (theme, language, etc.) instead of snapping back to DEFAULT light.
        const anonymousSettings = localStorage.getItem(settingsStorageKey(null))
        if (anonymousSettings) {
          try {
            const parsed = JSON.parse(anonymousSettings) as Settings
            nextSettings = mapSettingsFromApi(parsed, nextSettings)
            shouldPushBackend = true
            // Mark dirty before any await so a racing backend fetch cannot overwrite.
            settingsDirtyAtRef.current = Date.now()
            persistSettingsSnapshot(storageKey, nextSettings, { mirrorAnonymous: true })
          } catch (error) {
            console.error(t('console.failedParseSettings'), error)
          }
        }
      }

      if (nextSettings.language !== initialLocaleRef.current) {
        await applyLanguage(nextSettings.language)
      }

      if (!cancelled) {
        setSettings(nextSettings)
        setHydrated(true)
        if (shouldPushBackend && canUseBackend) {
          void settingsApi.updateSettings(nextSettings).catch((error) => {
            if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
              handleAuthFailure()
              return
            }
            console.error('Failed to persist migrated settings to backend', error)
          })
        }
      }
    }

    void hydrateFromStorage()

    return () => {
      cancelled = true
    }
  }, [applyLanguage, authReady, canUseBackend, storageKey, t, userId])

  useEffect(() => {
    let isMounted = true
    const loadStartedAt = Date.now()

    const loadFromBackend = async () => {
      if (typeof window === 'undefined') return
      if (!canUseBackend) return

      try {
        const data = await settingsApi.fetchSettings()
        if (!isMounted || data == null) return
        // Ignore stale/racing fetch if local settings changed at the same tick or later
        // (login migrate, user edits). Use >= so same-ms races keep local preference.
        if (settingsDirtyAtRef.current >= loadStartedAt) return

        let mergedLanguage: Settings['language'] | undefined

        setSettings((prev) => {
          const merged = mapSettingsFromApi(data, prev)
          mergedLanguage = merged.language
          persistSettingsSnapshot(storageKey, merged, {
            mirrorAnonymous: Boolean(userId),
          })
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
  }, [applyLanguage, canUseBackend, storageKey, userId])

  const persistToBackend = useCallback((payload: Partial<Settings>) => {
    if (typeof window === 'undefined') return
    if (!canUseBackend) return

    void settingsApi.updateSettings(payload).catch((error) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        handleAuthFailure()
        return
      }
      console.error('Failed to persist settings to backend', error)
    })
  }, [canUseBackend])

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    settingsDirtyAtRef.current = Date.now()
    setSettings((prev) => {
      const updated = { ...prev, ...updates }

      if (typeof window !== 'undefined') {
        persistSettingsSnapshot(storageKey, updated, {
          mirrorAnonymous: Boolean(userId),
        })
      }

      return updated
    })
    persistToBackend(updates)

    if (updates.language) {
      void applyLanguage(updates.language)
    }
  }, [applyLanguage, persistToBackend, storageKey, userId])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)

    if (typeof window !== 'undefined') {
      persistSettingsSnapshot(storageKey, DEFAULT_SETTINGS, {
        mirrorAnonymous: Boolean(userId),
      })
    }

    void applyLanguage(DEFAULT_SETTINGS.language)
    persistToBackend(DEFAULT_SETTINGS)
  }, [applyLanguage, persistToBackend, storageKey, userId])

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
