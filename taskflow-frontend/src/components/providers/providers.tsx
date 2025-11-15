'use client'

import { ThemeProvider } from './theme-provider'
import { I18nProvider } from './i18n-provider'
import { ToastProvider } from './toast-provider'
import { UserProvider } from './user-provider'
import { SettingsProvider } from './settings-provider'
import { ConfirmationProvider } from './confirmation-provider'
import { TaskManagerProvider } from './task-manager-provider'
import { GeminiProvider } from '@/lib/hooks/use-gemini'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <SettingsProvider>
          <GeminiProvider>
            <UserProvider>
              <TaskManagerProvider>
                <ToastProvider>
                  <ConfirmationProvider>
                    {children}
                  </ConfirmationProvider>
                </ToastProvider>
              </TaskManagerProvider>
            </UserProvider>
          </GeminiProvider>
        </SettingsProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
