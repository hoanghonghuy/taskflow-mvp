'use client'

import { createContext, useContext, useState, useCallback } from 'react'
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
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          return JSON.parse(savedUser)
        } catch (error) {
          console.error('Failed to parse saved user:', error)
          localStorage.removeItem('user')
        }
      }
    }
    return null
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const login = useCallback(async (email: string, _password: string) => {
    // Mock login - in a real app, you'd call an API
    // For mock, use the default user
    setUser(MOCK_USER)
    localStorage.setItem('user', JSON.stringify(MOCK_USER))
    localStorage.setItem('isAuthenticated', 'true')
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const register = useCallback(async (name: string, email: string, _password: string) => {
    // Mock register - logs info and then logs in the user
    console.log('Mock registration:', { name, email })
    // Use default user for mock
    setUser(MOCK_USER)
    localStorage.setItem('user', JSON.stringify(MOCK_USER))
    localStorage.setItem('isAuthenticated', 'true')
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('taskflowState')
  }, [])

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
