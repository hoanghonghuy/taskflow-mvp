import { prisma } from '../../lib/prisma'
import { toJsonString } from '../../lib/json'
import {
  defaultSettingsData,
  mapSettingsToDto,
  type SettingsDto,
} from '../../mappers/settings.mapper'

export async function getOrCreateSettings(userId: string): Promise<SettingsDto> {
  let settings = await prisma.userSettings.findUnique({ where: { userId } })
  if (!settings) {
    settings = await prisma.userSettings.create({ data: defaultSettingsData(userId) })
  }
  return mapSettingsToDto(settings)
}

export async function updateSettings(
  userId: string,
  body: Record<string, unknown>,
): Promise<SettingsDto> {
  let settings = await prisma.userSettings.findUnique({ where: { userId } })
  if (!settings) {
    settings = await prisma.userSettings.create({ data: defaultSettingsData(userId) })
  }

  const data: Record<string, unknown> = {}
  if ('language' in body) data.language = String(body.language ?? 'en')
  if ('theme' in body) data.theme = String(body.theme ?? 'light')
  if ('notifications' in body) data.notifications = Boolean(body.notifications)
  if ('soundEnabled' in body) data.soundEnabled = Boolean(body.soundEnabled)
  if ('autoStartPomodoro' in body) data.autoStartPomodoro = Boolean(body.autoStartPomodoro)
  if ('defaultPriority' in body) data.defaultPriority = String(body.defaultPriority ?? 'medium')
  if ('defaultListId' in body) data.defaultListId = String(body.defaultListId ?? 'inbox')
  if ('bottomNavActions' in body && Array.isArray(body.bottomNavActions)) {
    data.bottomNavActions = toJsonString(body.bottomNavActions.map(String))
  }
  if ('geminiApiKey' in body) {
    const key = body.geminiApiKey
    data.geminiApiKey = key != null && String(key).trim() ? String(key).trim() : null
  }

  const updated = await prisma.userSettings.update({ where: { userId }, data })
  return mapSettingsToDto(updated)
}
