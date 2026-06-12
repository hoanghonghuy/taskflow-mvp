'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/hooks'
import * as authApi from '@/lib/api/auth'
import type { User } from '@/types'

interface UserContextType {
  user: User | null
  allUsers: User[]
  isAuthenticated: boolean
  isAdmin: boolean
  authReady: boolean
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [authReady, setAuthReady] = useState(false)
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function validateSession() {
      try {
        const { ok, data } = await authApi.fetchSession()
        if (cancelled) return

        if (ok) {
          if (data?.authenticated) {
            let resolvedUser: User | null = data.user ?? null

            if (!resolvedUser) {
              const savedUser = localStorage.getItem('user')
              if (savedUser) {
                try {
                  resolvedUser = JSON.parse(savedUser) as User
                } catch (error) {
                  console.error(t('console.failedParseUser'), error)
                  localStorage.removeItem('user')
                }
              }
            }

            if (!resolvedUser) {
              resolvedUser = await authApi.fetchCurrentUser()
            }

            if (resolvedUser) {
              setUser(resolvedUser)
              localStorage.setItem('user', JSON.stringify(resolvedUser))
              localStorage.setItem('isAuthenticated', 'true')
              try {
                const collaborators = await authApi.fetchCollaborators()
                setAllUsers(collaborators)
              } catch {
                setAllUsers([])
              }
            } else {
              setUser(null)
              setAllUsers([])
              localStorage.removeItem('user')
              localStorage.removeItem('isAuthenticated')
            }
          } else {
            setUser(null)
            setAllUsers([])
            localStorage.removeItem('user')
            localStorage.removeItem('isAuthenticated')
          }
        } else {
          setUser(null)
          setAllUsers([])
          localStorage.removeItem('user')
          localStorage.removeItem('isAuthenticated')
        }
      } catch {
        if (!cancelled) {
          setUser(null)
          setAllUsers([])
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
    const loggedInUser = await authApi.login(email, password)

    if (typeof window !== 'undefined') {
      localStorage.removeItem('taskflowState')
    }

    setUser(loggedInUser)
    localStorage.setItem('user', JSON.stringify(loggedInUser))
    localStorage.setItem('isAuthenticated', 'true')
    return loggedInUser
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const registeredUser = await authApi.register(name, email, password)

    if (typeof window !== 'undefined') {
      localStorage.removeItem('taskflowState')
    }

    setUser(registeredUser)
    localStorage.setItem('user', JSON.stringify(registeredUser))
    localStorage.setItem('isAuthenticated', 'true')
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout failed', error)
    }

    setUser(null)
    setAllUsers([])
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('taskflowState')
  }, [])

  const refreshSession = useCallback(async () => {
    if (!user) return

    try {
      const ok = await authApi.refreshSession()

      if (!ok) {
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

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return

    if (updates.name) {
      const updated = await authApi.updateCurrentUser({ name: updates.name })
      if (!updated) return
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      return
    }

    setUser((prev) => {
      if (!prev) return null
      const next = { ...prev, ...updates }
      localStorage.setItem('user', JSON.stringify(next))
      return next
    })
  }, [user])

  return (
    <UserContext.Provider
      value={{
        user,
        allUsers,
        isAuthenticated: authReady && !!user,
        isAdmin: authReady && user?.role === 'ADMIN',
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
