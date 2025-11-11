'use client'

import { ThemeProvider } from './theme-provider'
import { I18nProvider } from './i18n-provider'
import { ToastProvider } from './toast-provider'
import { UserProvider } from './user-provider'
import { SettingsProvider } from './settings-provider'
import { ConfirmationProvider } from './confirmation-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <SettingsProvider>
          <UserProvider>
            <ToastProvider>
              <ConfirmationProvider>
                {children}
              </ConfirmationProvider>
            </ToastProvider>
          </UserProvider>
        </SettingsProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
