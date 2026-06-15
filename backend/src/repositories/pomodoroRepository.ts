import type { Prisma, PomodoroSession } from '@prisma/client'
import { prisma } from '../lib/prisma'

export async function findSessionsByUserId(
  userId: string,
  options?: { take?: number; since?: Date },
): Promise<PomodoroSession[]> {
  return prisma.pomodoroSession.findMany({
    where: {
      userId,
      ...(options?.since ? { startTime: { gte: options.since } } : {}),
    },
    orderBy: { startTime: 'desc' },
    take: options?.take,
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

export async function sumFocusSecondsByTaskId(userId: string): Promise<Map<string, number>> {
  const rows = await prisma.pomodoroSession.groupBy({
    by: ['taskId'],
    where: {
      userId,
      taskId: { not: null },
      type: 'focus',
    },
    _sum: { durationSeconds: true },
  })

  const totals = new Map<string, number>()
  for (const row of rows) {
    if (row.taskId) {
      totals.set(row.taskId, row._sum.durationSeconds ?? 0)
    }
  }
  return totals
}

export async function sumFocusSecondsForTask(userId: string, taskId: string): Promise<number> {
  const result = await prisma.pomodoroSession.aggregate({
    where: { userId, taskId, type: 'focus' },
    _sum: { durationSeconds: true },
  })
  return result._sum.durationSeconds ?? 0
}
