import type { UserSettings } from '@prisma/client'
import { parseJsonArray } from '../lib/json'
import {
  DEFAULT_POMODORO_SETTINGS,
  parsePomodoroSettings,
  type PomodoroSettingsDto,
} from '../lib/pomodoro-settings'

export type { PomodoroSettingsDto }

export interface BoardColumnDto {
  id: string
  name: string
  listId: string
}

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
  boardColumns: BoardColumnDto[]
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
    boardColumns: parseBoardColumns(settings.boardColumnsJson),
  }
}

function parseBoardColumns(json: string | null | undefined): BoardColumnDto[] {
  const parsed = parseJsonArray<{ id?: unknown; name?: unknown; listId?: unknown }>(json, [])
  return parsed
    .map((column) => ({
      id: String(column.id ?? '').trim(),
      name: String(column.name ?? '').trim(),
      listId: String(column.listId ?? '').trim(),
    }))
    .filter((column) => column.id && column.name && column.listId)
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
    boardColumnsJson: null,
  }
}

export { DEFAULT_POMODORO_SETTINGS }
