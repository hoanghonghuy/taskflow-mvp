'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/hooks'
import type { User } from '@/types'

interface UserContextType {
  user: User | null
  allUsers: User[]
  isAuthenticated: boolean
  authReady: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function validateSession() {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' })
        if (cancelled) return

        if (response.ok) {
          const data = (await response.json().catch(() => null)) as { authenticated?: boolean } | null
          if (data?.authenticated) {
            const savedUser = localStorage.getItem('user')
            if (savedUser) {
              try {
                setUser(JSON.parse(savedUser) as User)
                localStorage.setItem('isAuthenticated', 'true')
              } catch (error) {
                console.error(t('console.failedParseUser'), error)
                localStorage.removeItem('user')
                localStorage.removeItem('isAuthenticated')
              }
            }
          } else {
            setUser(null)
            localStorage.removeItem('user')
            localStorage.removeItem('isAuthenticated')
          }
        } else {
          setUser(null)
          localStorage.removeItem('user')
          localStorage.removeItem('isAuthenticated')
        }
      } catch {
        if (!cancelled) {
          setUser(null)
          localStorage.removeItem('user')
          localStorage.removeItem('isAuthenticated')
        }
      } finally {
        if (!cancelled) {
          setAuthReady(true)
        }
      }
    }

    void validateSession()
    return () => {
      cancelled = true
    }
  }, [t])

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/[...nextauth]', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
    })

    if (!response.ok) {
      throw new Error(`Login failed with status ${response.status}`)
    }

    const data = (await response.json().catch(() => null)) as { user?: User } | null

    if (data && data.user) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('taskflowState')
      }

      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('isAuthenticated', 'true')
      return
    }

    throw new Error('Login response did not contain user data')
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const response = await fetch('/api/auth/[...nextauth]', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', name, email, password }),
    })

    if (!response.ok) {
      throw new Error(`Register failed with status ${response.status}`)
    }

    const data = (await response.json().catch(() => null)) as { user?: User } | null

    if (data?.user) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('taskflowState')
      }

      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('isAuthenticated', 'true')
      return
    }

    throw new Error('Register response did not contain user data')
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/[...nextauth]', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      })
    } catch (error) {
      console.error('Logout failed', error)
    }

    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('taskflowState')
  }, [])

  const refreshSession = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch('/api/auth/[...nextauth]', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      })

      if (!response.ok) {
        await logout()
        return
      }

      setLastRefreshAt(Date.now())
    } catch (error) {
      console.error('Failed to refresh auth session', error)
      await logout()
    }
  }, [logout, user])

  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      void refreshSession()
    }, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user, refreshSession])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        const now = Date.now()
        if (!lastRefreshAt || now - lastRefreshAt > 60 * 1000) {
          void refreshSession()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, lastRefreshAt, refreshSession])

  const updateProfile = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null
      const updated = { ...prev, ...updates }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        allUsers: [],
        isAuthenticated: authReady && !!user,
        authReady,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}
