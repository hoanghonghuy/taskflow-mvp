'use client'

import type { Settings } from '@/types'
import { ThemeProvider } from './theme-provider'
import { I18nProvider } from './i18n-provider'
import { ToastProvider } from './toast-provider'
import { UserProvider } from './user-provider'
import { SettingsProvider } from './settings-provider'
import { ConfirmationProvider } from './confirmation-provider'
import { TaskManagerProvider } from './task-manager-provider'
import { ModalProvider } from './modal-provider'
import { GeminiProvider } from '@/lib/hooks/use-gemini'

interface ProvidersProps {
  children: React.ReactNode
  initialLocale: Settings['language']
}

export function Providers({ children, initialLocale }: ProvidersProps) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <SettingsProvider initialLocale={initialLocale}>
        <ThemeProvider>
          <GeminiProvider>
            <UserProvider>
              <TaskManagerProvider>
                <ToastProvider>
                  <ModalProvider>
                    <ConfirmationProvider>
                      {children}
                    </ConfirmationProvider>
                  </ModalProvider>
                </ToastProvider>
              </TaskManagerProvider>
            </UserProvider>
          </GeminiProvider>
        </ThemeProvider>
      </SettingsProvider>
    </I18nProvider>
  )
}
