import type { Prisma } from '@prisma/client'
import { toJsonString } from '../lib/json'
import { normalizeListId } from '../lib/inbox-list'
import { mergePomodoroSettings, parsePomodoroSettings } from '../lib/pomodoro-settings'
import { mapSettingsToDto, type SettingsDto } from '../mappers/settings.mapper'
import * as settingsRepository from '../repositories/settingsRepository'

export async function getOrCreateSettings(userId: string): Promise<SettingsDto> {
  const settings = await settingsRepository.getOrCreate(userId)
  return mapSettingsToDto(settings)
}

export async function updateSettings(
  userId: string,
  body: Record<string, unknown>,
): Promise<SettingsDto> {
  const settings = await settingsRepository.getOrCreate(userId)

  const data: Prisma.UserSettingsUpdateInput = {}
  if ('language' in body) data.language = String(body.language ?? 'en')
  if ('theme' in body) data.theme = String(body.theme ?? 'light')
  if ('notifications' in body) data.notifications = Boolean(body.notifications)
  if ('soundEnabled' in body) data.soundEnabled = Boolean(body.soundEnabled)
  if ('autoStartPomodoro' in body) data.autoStartPomodoro = Boolean(body.autoStartPomodoro)
  if ('defaultPriority' in body) data.defaultPriority = String(body.defaultPriority ?? 'medium')
  if ('defaultListId' in body) {
    data.defaultListId = await normalizeListId(userId, body.defaultListId ?? 'inbox')
  }
  if ('bottomNavActions' in body && Array.isArray(body.bottomNavActions)) {
    data.bottomNavActions = toJsonString(body.bottomNavActions.map(String))
  }
  if ('geminiApiKey' in body) {
    const key = body.geminiApiKey
    data.geminiApiKey = key != null && String(key).trim() ? String(key).trim() : null
  }
  if ('pomodoroSettings' in body && body.pomodoroSettings && typeof body.pomodoroSettings === 'object') {
    const current = parsePomodoroSettings(settings.pomodoroSettingsJson)
    const merged = mergePomodoroSettings(current, body.pomodoroSettings as Record<string, unknown>)
    data.pomodoroSettingsJson = toJsonString(merged)
  }

  const updated = await settingsRepository.updateByUserId(userId, data)
  return mapSettingsToDto(updated)
}
