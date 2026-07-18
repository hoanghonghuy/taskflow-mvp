import type { Prisma, RefreshToken, User } from '@prisma/client'
import { prisma } from '../lib/prisma'

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } })
}

export async function createUser(data: Prisma.UserCreateInput): Promise<User> {
  return prisma.user.create({ data })
}

export async function createRefreshToken(data: Prisma.RefreshTokenCreateInput): Promise<RefreshToken> {
  return prisma.refreshToken.create({ data })
}

export async function findRefreshTokenWithUser(token: string) {
  return prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  })
}

export async function revokeRefreshToken(id: string): Promise<void> {
  await prisma.refreshToken.update({
    where: { id },
    data: { revoked: true },
  })
}

/**
 * Atomically consume a refresh token: only one caller wins when the same
 * token is presented concurrently. Returns the token+user row when consumed,
 * or null when invalid / already revoked / expired / lost the race.
 */
export async function consumeRefreshToken(token: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!existing || existing.revoked || existing.expiresAt <= new Date()) {
      return null
    }

    const result = await tx.refreshToken.updateMany({
      where: { id: existing.id, revoked: false },
      data: { revoked: true },
    })

    if (result.count !== 1) {
      return null
    }

    return existing
  })
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } })
}

export async function updateUserName(id: string, name: string): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: { name },
  })
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  })
}

export async function findUsersByIds(ids: string[]) {
  if (ids.length === 0) return []
  return prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true, role: true },
  })
}
