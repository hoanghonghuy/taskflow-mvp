import type { Prisma, CountdownEvent } from '@prisma/client'
import { prisma } from '../lib/prisma'

export async function findCountdownsByUserId(userId: string): Promise<CountdownEvent[]> {
  return prisma.countdownEvent.findMany({
    where: { userId },
    orderBy: { targetDate: 'asc' },
  })
}

export async function findCountdownByIdAndUserId(
  id: string,
  userId: string,
): Promise<CountdownEvent | null> {
  return prisma.countdownEvent.findFirst({ where: { id, userId } })
}

export async function createCountdown(data: Prisma.CountdownEventCreateInput): Promise<CountdownEvent> {
  return prisma.countdownEvent.create({ data })
}

export async function updateCountdown(
  id: string,
  data: Prisma.CountdownEventUpdateInput,
): Promise<CountdownEvent> {
  return prisma.countdownEvent.update({ where: { id }, data })
}

export async function deleteCountdown(id: string): Promise<void> {
  await prisma.countdownEvent.delete({ where: { id } })
}
