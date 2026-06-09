import type { Prisma, UserRole } from '@prisma/client'
import { prisma } from '../lib/prisma'

export async function countUsers(): Promise<number> {
  return prisma.user.count()
}

export async function countUsersByRole(role: UserRole): Promise<number> {
  return prisma.user.count({ where: { role } })
}

export async function countTasks(): Promise<number> {
  return prisma.todoTask.count()
}

export async function countHabits(): Promise<number> {
  return prisma.habit.count()
}

export async function countLists(): Promise<number> {
  return prisma.todoList.count()
}

export async function countPomodoroSessions(): Promise<number> {
  return prisma.pomodoroSession.count()
}

export async function countCountdowns(): Promise<number> {
  return prisma.countdownEvent.count()
}

export async function countUsersCreatedSince(since: Date): Promise<number> {
  return prisma.user.count({ where: { createdAt: { gte: since } } })
}

export async function countAdmins(): Promise<number> {
  return prisma.user.count({ where: { role: 'ADMIN' } })
}

export async function findRecentUsers(take: number) {
  return prisma.user.findMany({
    take,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })
}

export async function findUsers(params: {
  skip: number
  take: number
  search?: string
  role?: UserRole
}) {
  const filters: Prisma.UserWhereInput[] = []

  if (params.search) {
    filters.push({
      OR: [
        { email: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ],
    })
  }

  if (params.role) {
    filters.push({ role: params.role })
  }

  const where: Prisma.UserWhereInput | undefined =
    filters.length > 0 ? { AND: filters } : undefined

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
          countdownEvents: true,
        },
      },
    },
  })
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string },
) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })
}

export async function demoteExtraAdmins(canonicalEmail: string): Promise<number> {
  const result = await prisma.user.updateMany({
    where: {
      role: 'ADMIN',
      email: { not: canonicalEmail },
    },
    data: { role: 'USER' },
  })
  return result.count
}

export async function deleteUserById(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } })
}
