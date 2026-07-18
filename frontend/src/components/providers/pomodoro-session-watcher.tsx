'use client'

import { usePomodoroNotifications } from '@/lib/hooks/use-pomodoro-notifications'

/** Sync focus completions (API session + achievements) even when not on /pomodoro. */
export function PomodoroSessionWatcher() {
  usePomodoroNotifications()
  return null
}
