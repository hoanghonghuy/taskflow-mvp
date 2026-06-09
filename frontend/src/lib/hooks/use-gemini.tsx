"use client"

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as aiApi from '@/lib/api/ai'
import type { AiProvider } from '@/lib/api/ai'
import { AI_FEATURES_ENABLED } from '@/lib/feature-flags'

interface GeminiContextValue {
  ai: null
  isAvailable: boolean
  isLoading: boolean
  provider: AiProvider
}

const GeminiContext = createContext<GeminiContextValue | undefined>(undefined)

export const GeminiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [provider, setProvider] = useState<AiProvider>('gemini')

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      if (!AI_FEATURES_ENABLED) {
        if (!cancelled) {
          setIsAvailable(false)
          setProvider('gemini')
          setIsLoading(false)
        }
        return
      }

      try {
        const status = await aiApi.fetchAiStatus()
        if (!cancelled) {
          setIsAvailable(status.available)
          setProvider(status.provider)
        }
      } catch {
        if (!cancelled) {
          setIsAvailable(false)
          setProvider('gemini')
        }
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
    <GeminiContext.Provider value={{ ai: null, isAvailable, isLoading, provider }}>
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
