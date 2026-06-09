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
