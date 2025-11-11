'use client'

import { createContext, useContext } from 'react'
import { toast as sonnerToast } from 'sonner'

export interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

interface ToastContextType {
  toast: (options: ToastOptions) => void
  success: (message: string, description?: string) => void
  error: (message: string, description?: string) => void
  info: (message: string, description?: string) => void
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    }
  ) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = ({ title, description, variant, duration }: ToastOptions) => {
    const message = title || description || ''
    const desc = title && description ? description : undefined

    switch (variant) {
      case 'destructive':
        sonnerToast.error(message, { description: desc, duration })
        break
      case 'success':
        sonnerToast.success(message, { description: desc, duration })
        break
      default:
        sonnerToast(message, { description: desc, duration })
    }
  }

  const success = (message: string, description?: string) => {
    sonnerToast.success(message, { description })
  }

  const error = (message: string, description?: string) => {
    sonnerToast.error(message, { description })
  }

  const info = (message: string, description?: string) => {
    sonnerToast.info(message, { description })
  }

  const promise = <T,>(
    promiseToResolve: Promise<T>,
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    }
  ) => {
    sonnerToast.promise(promiseToResolve, options)
  }

  return (
    <ToastContext.Provider value={{ toast, success, error, info, promise }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
