'use client'

import { ThemeProvider } from './theme-provider'
import { I18nProvider } from './i18n-provider'
import { ToastProvider } from './toast-provider'
import { UserProvider } from './user-provider'
import { SettingsProvider } from './settings-provider'
import { ConfirmationProvider } from './confirmation-provider'
import { TaskManagerProvider } from './task-manager-provider'
import { ModalProvider } from './modal-provider'
import { GeminiProvider } from '@/lib/hooks/use-gemini'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SettingsProvider>
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
