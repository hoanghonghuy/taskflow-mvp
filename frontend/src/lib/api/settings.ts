import type { PomodoroState, Settings, ThemeOption } from '@/types'
import { THEME_PRESET_IDS } from '@/lib/theme-presets'
import { apiFetch, apiFetchJson, unwrapApiData } from './client'

const THEME_OPTIONS_SET = new Set<ThemeOption>(['system', ...THEME_PRESET_IDS])

export function mapSettingsFromApi(payload: unknown, fallback: Settings): Settings {
  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  const data = { ...(payload as Partial<Settings> & { geminiApiKey?: unknown }) }
  delete data.geminiApiKey

  const language = data.language === 'en' || data.language === 'vi' ? data.language : fallback.language
  const theme = ((): Settings['theme'] => {
    const candidate = data.theme as ThemeOption | undefined
    if (candidate && THEME_OPTIONS_SET.has(candidate)) {
      return candidate
    }
    return fallback.theme
  })()

  return {
    ...fallback,
    ...data,
    language,
    theme,
    bottomNavActions:
      data.bottomNavActions && data.bottomNavActions.length > 0
        ? data.bottomNavActions
        : fallback.bottomNavActions,
  }
}

export type PomodoroSettingsDto = PomodoroState['settings']

export async function fetchSettings(): Promise<unknown | null> {
  const response = await apiFetch('/api/settings', { method: 'GET' })
  if (!response.ok) return null
  const json = await response.json().catch(() => null)
  return json ? unwrapApiData<unknown>(json, response.status) : null
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
  await apiFetch('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({ pomodoroSettings: settings }),
  })
}
