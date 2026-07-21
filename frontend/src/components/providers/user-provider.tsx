'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { onSessionExpired } from '@/lib/auth/session-events'
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
  updateProfile: (updates: Partial<User>) => Promise<boolean>
  refreshCollaborators: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
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
                  console.error('Failed to parse saved user from localStorage', error)
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
              void authApi.logout().catch(() => {})
            }
          } else {
            setUser(null)
            setAllUsers([])
            localStorage.removeItem('user')
            localStorage.removeItem('isAuthenticated')
            void authApi.logout().catch(() => {})
          }
        } else {
          setUser(null)
          setAllUsers([])
          localStorage.removeItem('user')
          localStorage.removeItem('isAuthenticated')
          void authApi.logout().catch(() => {})
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
  }, [])

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

  useEffect(() => {
    return onSessionExpired(() => {
      void logout()
    })
  }, [logout])

  const refreshSession = useCallback(async () => {
    if (!user) return

    try {
      const result = await authApi.refreshSession()

      if (result === 'expired') {
        await logout()
        return
      }

      if (result === 'refreshed') {
        setLastRefreshAt(Date.now())
      }
    } catch (error) {
      console.error('Failed to refresh auth session', error)
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

  const refreshCollaborators = useCallback(async () => {
    try {
      const collaborators = await authApi.fetchCollaborators()
      setAllUsers(collaborators)
    } catch {
      setAllUsers([])
    }
  }, [])

  const updateProfile = useCallback(async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false

    if (updates.name) {
      const updated = await authApi.updateCurrentUser({ name: updates.name })
      if (!updated) return false
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      return true
    }

    setUser((prev) => {
      if (!prev) return null
      const next = { ...prev, ...updates }
      localStorage.setItem('user', JSON.stringify(next))
      return next
    })
    return true
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
        refreshCollaborators,
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
