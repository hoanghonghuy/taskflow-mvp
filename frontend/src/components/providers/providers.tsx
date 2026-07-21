'use client'

import type { Settings } from '@/types'
import { ThemeProvider } from './theme-provider'
import { I18nProvider } from './i18n-provider'
import { ToastProvider } from './toast-provider'
import { UserProvider, useUser } from './user-provider'
import { SettingsProvider } from './settings-provider'
import { ConfirmationProvider } from './confirmation-provider'
import { TaskManagerProvider } from './task-manager-provider'
import { TaskReminderWatcher } from './task-reminder-watcher'
import { PomodoroSessionWatcher } from './pomodoro-session-watcher'
import { ModalProvider } from './modal-provider'
import { GeminiProvider } from '@/lib/hooks/use-gemini'

interface ProvidersProps {
  children: React.ReactNode
  initialLocale: Settings['language']
}

function UserScopedProviders({ children, initialLocale }: ProvidersProps) {
  const { user, authReady } = useUser()

  return (
    <SettingsProvider
      initialLocale={initialLocale}
      authScope={{ ready: authReady, userId: user?.id ?? null }}
    >
      <ThemeProvider>
        <GeminiProvider>
          <TaskManagerProvider key={user?.id ?? 'anonymous'}>
            <ToastProvider>
              <TaskReminderWatcher />
              <PomodoroSessionWatcher />
              <ModalProvider>
                <ConfirmationProvider>
                  {children}
                </ConfirmationProvider>
              </ModalProvider>
            </ToastProvider>
          </TaskManagerProvider>
        </GeminiProvider>
      </ThemeProvider>
    </SettingsProvider>
  )
}

export function Providers({ children, initialLocale }: ProvidersProps) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <UserProvider>
        <UserScopedProviders initialLocale={initialLocale}>
          {children}
        </UserScopedProviders>
      </UserProvider>
    </I18nProvider>
  )
}
