'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useI18n } from '@/lib/hooks/use-i18n'
import type { User } from '@/types'

// Mock users for development - matching template
const MOCK_USER: User = {
  id: 'user-001',
  name: 'Alex Ryder',
  email: 'alex.ryder@example.com',
  avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Alex%20Ryder',
}

const MOCK_USERS: User[] = [
  MOCK_USER,
  {
    id: 'user-002',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Jane%20Doe',
  },
  {
    id: 'user-003',
    name: 'John Smith',
    email: 'john.smith@example.com',
    avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=John%20Smith',
  },
  {
    id: 'user-004',
    name: 'Emily White',
    email: 'emily.white@example.com',
    avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Emily%20White',
  },
]

interface UserContextType {
  user: User | null
  allUsers: User[]
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          return JSON.parse(savedUser)
        } catch (error) {
          console.error(t('console.failedParseUser'), error)
          localStorage.removeItem('user')
        }
      }
    }
    return null
  })

  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null)

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
      // Clear any previous taskflow state so new user starts from backend data only
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

    // After successful registration, attempt login to obtain JWT cookie and user
    await login(email, password)
  }, [login])

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
        // If refresh fails (expired/invalid refresh token), log out the user to avoid
        // keeping a stale authenticated state on the client.
        await logout()
        return
      }

      setLastRefreshAt(Date.now())
    } catch (error) {
      console.error('Failed to refresh auth session', error)
      await logout()
    }
  }, [logout, user])

  // Periodically refresh token while the user is authenticated
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      void refreshSession()
    }, 10 * 60 * 1000) // every 10 minutes

    return () => clearInterval(interval)
  }, [user, refreshSession])

  // Attempt refresh when the tab becomes visible again
  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Avoid spamming refresh on rapid focus changes
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
        allUsers: MOCK_USERS,
        isAuthenticated: !!user,
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
