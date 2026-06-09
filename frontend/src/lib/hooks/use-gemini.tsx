"use client"

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface GeminiContextValue {
  ai: null
  isAvailable: boolean
  isLoading: boolean
}

const GeminiContext = createContext<GeminiContextValue | undefined>(undefined)

export const GeminiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      try {
        const response = await fetch('/api/ai/status')
        if (!response.ok) {
          if (!cancelled) setIsAvailable(false)
          return
        }
        const data = (await response.json().catch(() => null)) as { available?: boolean } | null
        if (!cancelled) {
          setIsAvailable(Boolean(data?.available))
        }
      } catch {
        if (!cancelled) setIsAvailable(false)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadStatus()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <GeminiContext.Provider value={{ ai: null, isAvailable, isLoading }}>
      {children}
    </GeminiContext.Provider>
  )
}

export const useGemini = (): GeminiContextValue => {
  const context = useContext(GeminiContext)
  if (context === undefined) {
    throw new Error('useGemini must be used within a GeminiProvider')
  }
  return context
}
