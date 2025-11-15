'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { User } from '@/types'

// Mock users for development
const MOCK_USERS: User[] = [
  {
    id: 'user-001',
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
  },
  {
    id: 'user-002',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
  },
  {
    id: 'user-003',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
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
    // TODO: Replace with real API call when backend is ready
    const mockUser: User = {
      id: 'user-1',
      name: email.split('@')[0],
      email,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    }
    
    setUser(mockUser)
    localStorage.setItem('user', JSON.stringify(mockUser))
    localStorage.setItem('isAuthenticated', 'true')
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const register = useCallback(async (name: string, email: string, _password: string) => {
    // TODO: Replace with real API call when backend is ready
    const mockUser: User = {
      id: 'user-1',
      name,
      email,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    }
    
    setUser(mockUser)
    localStorage.setItem('user', JSON.stringify(mockUser))
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
