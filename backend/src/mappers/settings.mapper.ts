import type { UserSettings } from '@prisma/client'
import { parseJsonArray } from '../lib/json'
import {
  DEFAULT_POMODORO_SETTINGS,
  parsePomodoroSettings,
  type PomodoroSettingsDto,
} from '../lib/pomodoro-settings'

export type { PomodoroSettingsDto }

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
  pomodoroSettings: PomodoroSettingsDto
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
    pomodoroSettings: parsePomodoroSettings(settings.pomodoroSettingsJson),
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
    pomodoroSettingsJson: null,
  }
}

export { DEFAULT_POMODORO_SETTINGS }
