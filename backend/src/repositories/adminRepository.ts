import type { Prisma, UserRole } from '@prisma/client'
import { prisma } from '../lib/prisma'

export async function countUsers(): Promise<number> {
  return prisma.user.count()
}

export async function countTasks(): Promise<number> {
  return prisma.todoTask.count()
}

export async function countHabits(): Promise<number> {
  return prisma.habit.count()
}

export async function countUsersCreatedSince(since: Date): Promise<number> {
  return prisma.user.count({ where: { createdAt: { gte: since } } })
}

export async function countAdmins(): Promise<number> {
  return prisma.user.count({ where: { role: 'ADMIN' } })
}

export async function findUsers(params: {
  skip: number
  take: number
  search?: string
}) {
  const where: Prisma.UserWhereInput | undefined = params.search
    ? {
        OR: [
          { email: { contains: params.search, mode: 'insensitive' } },
          { name: { contains: params.search, mode: 'insensitive' } },
        ],
      }
    : undefined

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ])

  return { items, total }
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          tasks: true,
          habits: true,
          lists: true,
          pomodoroSessions: true,
        },
      },
    },
  })
}

export async function updateUserRole(id: string, role: UserRole) {
  return prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })
}

export async function deleteUserById(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } })
}
