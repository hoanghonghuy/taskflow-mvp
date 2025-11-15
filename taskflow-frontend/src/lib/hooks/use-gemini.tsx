'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'

// Note: GoogleGenAI will be moved to backend later
// For now, we'll create a simple mock implementation
interface GeminiContextType {
  ai: any | null // GoogleGenAI | null - will be typed properly when backend is ready
  isAvailable: boolean
}

const GeminiContext = createContext<GeminiContextType | undefined>(undefined)

export const GeminiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ai, setAi] = useState<any | null>(null)
  const isAvailable = useMemo(() => !!ai, [ai])

  useEffect(() => {
    // TODO: Move Gemini service to backend
    // For now, Gemini features are disabled
    // When backend is ready, this will call the backend API
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (apiKey) {
      // TODO: Initialize Gemini client when backend is ready
      // For now, we'll just set isAvailable to false
      console.warn("Gemini API key found but backend integration is pending. Gemini features will be disabled.")
      setAi(null)
    } else {
      console.warn("NEXT_PUBLIC_GEMINI_API_KEY environment variable not found. Gemini features will be disabled.")
      setAi(null)
    }
  }, [])
  
  const contextValue = {
    ai,
    isAvailable,
  }

  return (
    <GeminiContext.Provider value={contextValue}>
      {children}
    </GeminiContext.Provider>
  )
}

export const useGemini = (): GeminiContextType => {
  const context = useContext(GeminiContext)
  if (context === undefined) {
    throw new Error('useGemini must be used within a GeminiProvider')
  }
  return context
}

