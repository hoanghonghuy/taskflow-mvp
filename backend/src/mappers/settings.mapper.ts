import type { UserSettings } from '@prisma/client'
import { parseJsonArray } from '../lib/json'

export interface SettingsDto {
  language: string
  theme: string
  notifications: boolean
  soundEnabled: boolean
  autoStartPomodoro: boolean
  defaultPriority: string
  defaultListId: string
  bottomNavActions: string[]
  geminiApiKey: string | null
}

export function mapSettingsToDto(settings: UserSettings): SettingsDto {
  return {
    language: settings.language,
    theme: settings.theme,
    notifications: settings.notifications,
    soundEnabled: settings.soundEnabled,
    autoStartPomodoro: settings.autoStartPomodoro,
    defaultPriority: settings.defaultPriority,
    defaultListId: settings.defaultListId,
    bottomNavActions: parseJsonArray<string>(settings.bottomNavActions, [
      'dashboard',
      'list',
      'board',
      'calendar',
    ]),
    geminiApiKey: settings.geminiApiKey ? 'configured' : null,
  }
}

export function defaultSettingsData(userId: string) {
  return {
    userId,
    language: 'en',
    theme: 'light',
    notifications: true,
    soundEnabled: false,
    autoStartPomodoro: false,
    defaultPriority: 'medium',
    defaultListId: 'inbox',
    bottomNavActions: JSON.stringify(['dashboard', 'list', 'board', 'calendar']),
    geminiApiKey: null,
    pomodoroStateJson: null,
    pomodoroStateUpdatedAt: null,
  }
}
