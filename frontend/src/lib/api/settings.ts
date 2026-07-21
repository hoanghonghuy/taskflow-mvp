import type { PomodoroState, Settings, ThemeOption } from '@/types'
import { THEME_PRESET_IDS } from '@/lib/theme-presets'
import { apiFetchJson } from './client'

const THEME_OPTIONS_SET = new Set<ThemeOption>(['system', ...THEME_PRESET_IDS])

export function mapSettingsFromApi(payload: unknown, fallback: Settings): Settings {
  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  const data = payload as Partial<Settings>

  const language = data.language === 'en' || data.language === 'vi' ? data.language : fallback.language
  const theme = ((): Settings['theme'] => {
    const candidate = data.theme as ThemeOption | undefined
    if (candidate && THEME_OPTIONS_SET.has(candidate)) {
      return candidate
    }
    return fallback.theme
  })()

  return {
    language,
    theme,
    notifications:
      typeof data.notifications === 'boolean' ? data.notifications : fallback.notifications,
    soundEnabled:
      typeof data.soundEnabled === 'boolean' ? data.soundEnabled : fallback.soundEnabled,
    autoStartPomodoro:
      typeof data.autoStartPomodoro === 'boolean'
        ? data.autoStartPomodoro
        : fallback.autoStartPomodoro,
    defaultPriority: data.defaultPriority ?? fallback.defaultPriority,
    defaultListId:
      typeof data.defaultListId === 'string' ? data.defaultListId : fallback.defaultListId,
    bottomNavActions:
      Array.isArray(data.bottomNavActions) && data.bottomNavActions.length > 0
        ? data.bottomNavActions
        : fallback.bottomNavActions,
  }
}

export type PomodoroSettingsDto = PomodoroState['settings']

export async function fetchSettings(): Promise<unknown | null> {
  return (await apiFetchJson<unknown | undefined>('/api/settings', {
    method: 'GET',
  })) ?? null
}

export async function fetchPomodoroSettings(): Promise<PomodoroSettingsDto | null> {
  const json = (await fetchSettings()) as { pomodoroSettings?: PomodoroSettingsDto } | null
  const ps = json?.pomodoroSettings
  return ps && typeof ps === 'object' ? ps : null
}

export async function updateSettings(payload: Partial<Settings>): Promise<void> {
  await apiFetchJson('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function updatePomodoroSettings(settings: PomodoroSettingsDto): Promise<void> {
  await apiFetchJson('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({ pomodoroSettings: settings }),
  })
}

export async function updateBoardColumns(
  boardColumns: Array<{ id: string; name: string; listId: string }>,
): Promise<void> {
  await apiFetchJson('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({ boardColumns }),
  })
}
