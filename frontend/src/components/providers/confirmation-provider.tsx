'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useI18n } from '@/lib/i18n/hooks'

interface ConfirmationOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => Promise<boolean>
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined)

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmationOptions | null>(null)
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmationOptions): Promise<boolean> => {
    setOptions(opts)
    setIsOpen(true)

    return new Promise((resolve) => {
      setResolver(() => resolve)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (resolver) {
      resolver(true)
      setResolver(null)
    }
    setIsOpen(false)
  }, [resolver])

  const handleCancel = useCallback(() => {
    if (resolver) {
      resolver(false)
      setResolver(null)
    }
    setIsOpen(false)
  }, [resolver])

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}

      {options && (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{options.title}</AlertDialogTitle>
              <AlertDialogDescription>{options.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel}>
                {options.cancelText || t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                variant={options.variant === 'destructive' ? 'destructive' : 'default'}
              >
                {options.confirmText || t('common.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </ConfirmationContext.Provider>
  )
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext)
  if (context === undefined) {
    throw new Error('useConfirmation must be used within ConfirmationProvider')
  }
  return context
}
