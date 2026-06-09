import type { Prisma, Habit } from '@prisma/client'
import { prisma } from '../lib/prisma'

export async function findHabitsByUserId(userId: string): Promise<Habit[]> {
  return prisma.habit.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function findHabitByIdAndUserId(id: string, userId: string): Promise<Habit | null> {
  return prisma.habit.findFirst({ where: { id, userId } })
}

export async function createHabit(data: Prisma.HabitCreateInput): Promise<Habit> {
  return prisma.habit.create({ data })
}

export async function updateHabit(id: string, data: Prisma.HabitUpdateInput): Promise<Habit> {
  return prisma.habit.update({ where: { id }, data })
}

export async function deleteHabit(id: string): Promise<void> {
  await prisma.habit.delete({ where: { id } })
}
