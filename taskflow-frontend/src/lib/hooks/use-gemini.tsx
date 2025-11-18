'use client'

import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useSettings } from '@/components/providers/settings-provider'

// Note: GoogleGenAI will be moved to backend later
// For now, we'll create a simple mock implementation
interface GeminiContextValue {
  ai: null
  isAvailable: false
}

const GeminiContext = createContext<GeminiContextValue | undefined>(undefined)

export const GeminiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useI18n()
  const { settings } = useSettings()
  const { geminiApiKey } = settings
  const contextValue: GeminiContextValue = {
    ai: null,
    isAvailable: false,
  }

  useEffect(() => {
    // TODO: Move Gemini service to backend
    // For now, Gemini features are disabled
    // When backend is ready, this will call the backend API
    const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    const apiKey = geminiApiKey || envKey
    if (apiKey) {
      // TODO: Initialize Gemini client when backend is ready
      // For now, we'll just set isAvailable to false
      console.warn(t('console.geminiKeyFound'))
    } else {
      console.warn(t('console.geminiKeyNotFound'))
    }
  }, [t, geminiApiKey])
  
  return (
    <GeminiContext.Provider value={contextValue}>
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

