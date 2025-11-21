"use client"

import React, { createContext, useContext, ReactNode } from 'react'

// Note: GoogleGenAI will be moved to backend later
// For now, we'll create a simple mock implementation
interface GeminiContextValue {
  ai: null
  isAvailable: boolean
}

const GeminiContext = createContext<GeminiContextValue | undefined>(undefined)

export const GeminiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const contextValue: GeminiContextValue = {
    ai: null,
    isAvailable: true,
  }

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

