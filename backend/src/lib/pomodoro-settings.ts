import { parseJsonObject, toJsonString } from './json'

export interface PomodoroSettingsDto {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettingsDto = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
}

function clampMinutes(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(1, Math.min(180, Math.round(n)))
}

export function parsePomodoroSettings(json: string | null | undefined): PomodoroSettingsDto {
  const parsed = parseJsonObject<Partial<PomodoroSettingsDto>>(json)
  if (!parsed) return { ...DEFAULT_POMODORO_SETTINGS }

  return {
    focusDuration: clampMinutes(parsed.focusDuration, DEFAULT_POMODORO_SETTINGS.focusDuration),
    shortBreakDuration: clampMinutes(
      parsed.shortBreakDuration,
      DEFAULT_POMODORO_SETTINGS.shortBreakDuration,
    ),
    longBreakDuration: clampMinutes(
      parsed.longBreakDuration,
      DEFAULT_POMODORO_SETTINGS.longBreakDuration,
    ),
    sessionsUntilLongBreak: clampMinutes(
      parsed.sessionsUntilLongBreak,
      DEFAULT_POMODORO_SETTINGS.sessionsUntilLongBreak,
    ),
  }
}

export function mergePomodoroSettings(
  current: PomodoroSettingsDto,
  patch: Record<string, unknown>,
): PomodoroSettingsDto {
  return parsePomodoroSettings(
    toJsonString({
      ...current,
      ...patch,
    }),
  )
}
