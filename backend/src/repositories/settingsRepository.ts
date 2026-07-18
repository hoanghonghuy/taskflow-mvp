import type { Prisma, UserSettings } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { defaultSettingsData } from '../mappers/settings.mapper'

export async function findByUserId(userId: string): Promise<UserSettings | null> {
  return prisma.userSettings.findUnique({ where: { userId } })
}

export async function getOrCreate(userId: string): Promise<UserSettings> {
  // upsert tránh race khi 2 request lần đầu cùng tạo settings (unique userId).
  return prisma.userSettings.upsert({
    where: { userId },
    create: defaultSettingsData(userId),
    update: {},
  })
}

export async function upsertByUserId(
  userId: string,
  updateData: Prisma.UserSettingsUpdateInput,
): Promise<UserSettings> {
  // Dùng upsert để đảm bảo settings tồn tại và cập nhật trong 1 round-trip.
  // Tránh race: nếu 2 request cùng lúc, request 1 tạo, request 2 update.
  const defaults = defaultSettingsData(userId)
  return prisma.userSettings.upsert({
    where: { userId },
    // Nhánh create phải gồm updateData — nếu không, lần PUT pomodoro đầu tiên
    // (user chưa có UserSettings) sẽ tạo row với pomodoroStateJson = null.
    create: {
      ...defaults,
      ...(updateData as Prisma.UserSettingsUncheckedCreateInput),
      userId,
    },
    update: updateData,
  })
}

export async function updateByUserId(
  userId: string,
  data: Prisma.UserSettingsUpdateInput,
  expectedUpdatedAt?: Date | null,
): Promise<UserSettings> {
  // Optimistic concurrency: nếu caller cung cấp expectedUpdatedAt thì chỉ update
  // khi pomodoroStateUpdatedAt chưa bị ai khác thay đổi. Tránh 2 request GET state
  // đồng thời cùng tính elapsed → cùng ghi đè, làm mất tick của request sau.
  if (expectedUpdatedAt !== undefined) {
    const result = await prisma.userSettings.updateMany({
      where: { userId, pomodoroStateUpdatedAt: expectedUpdatedAt },
      data,
    })
    if (result.count === 0) {
      throw new ConcurrentUpdateError('pomodoroStateUpdatedAt changed by another request')
    }
    const updated = await findByUserId(userId)
    return updated!
  }
  return prisma.userSettings.update({ where: { userId }, data })
}

export class ConcurrentUpdateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConcurrentUpdateError'
  }
}
