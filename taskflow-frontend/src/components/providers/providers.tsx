"use client"

import { I18nProvider } from './i18n-provider'
import { ToastProvider } from './toast-provider'
import { UserProvider } from './user-provider'
import { SettingsProvider } from './settings-provider'
import { ConfirmationProvider } from './confirmation-provider'
import { TaskManagerProvider } from './task-manager-provider'
import { GeminiProvider } from './gemini-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <SettingsProvider>
        <I18nProvider>
          <ToastProvider>
            <TaskManagerProvider>
              <ConfirmationProvider>
                <GeminiProvider>
                  {children}
                </GeminiProvider>
              </ConfirmationProvider>
            </TaskManagerProvider>
          </ToastProvider>
        </I18nProvider>
      </SettingsProvider>
    </UserProvider>
  )
}
