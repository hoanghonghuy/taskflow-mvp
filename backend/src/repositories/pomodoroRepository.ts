import type { Prisma, PomodoroSession } from '@prisma/client'
import { prisma } from '../lib/prisma'

export async function findSessionsByUserId(userId: string): Promise<PomodoroSession[]> {
  return prisma.pomodoroSession.findMany({
    where: { userId },
    orderBy: { startTime: 'desc' },
  })
}

export async function findSessionByIdAndUserId(
  id: string,
  userId: string,
): Promise<PomodoroSession | null> {
  return prisma.pomodoroSession.findFirst({ where: { id, userId } })
}

export async function createSession(data: Prisma.PomodoroSessionCreateInput): Promise<PomodoroSession> {
  return prisma.pomodoroSession.create({ data })
}
