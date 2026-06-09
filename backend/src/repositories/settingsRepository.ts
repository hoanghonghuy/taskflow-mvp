import type { Prisma, UserSettings } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { defaultSettingsData } from '../mappers/settings.mapper'

export async function findByUserId(userId: string): Promise<UserSettings | null> {
  return prisma.userSettings.findUnique({ where: { userId } })
}

export async function getOrCreate(userId: string): Promise<UserSettings> {
  const existing = await findByUserId(userId)
  if (existing) return existing

  return prisma.userSettings.create({ data: defaultSettingsData(userId) })
}

export async function updateByUserId(
  userId: string,
  data: Prisma.UserSettingsUpdateInput,
): Promise<UserSettings> {
  return prisma.userSettings.update({ where: { userId }, data })
}
