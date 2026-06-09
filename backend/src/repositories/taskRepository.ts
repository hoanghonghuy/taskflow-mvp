import type { Prisma, TodoTask } from '@prisma/client'
import { prisma } from '../lib/prisma'

export async function findTasksByUserId(userId: string): Promise<TodoTask[]> {
  return prisma.todoTask.findMany({
    where: { userId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function findMaxSortOrder(userId: string): Promise<number> {
  const row = await prisma.todoTask.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  })
  return row._max.sortOrder ?? 0
}

export async function updateTaskSortOrders(
  userId: string,
  orderedIds: string[],
): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.todoTask.updateMany({
        where: { id, userId },
        data: { sortOrder: index },
      }),
    ),
  )
}

export async function findTaskByIdAndUserId(id: string, userId: string): Promise<TodoTask | null> {
  return prisma.todoTask.findFirst({ where: { id, userId } })
}

export async function createTask(data: Prisma.TodoTaskCreateInput): Promise<TodoTask> {
  return prisma.todoTask.create({ data })
}

export async function updateTask(id: string, data: Prisma.TodoTaskUpdateInput): Promise<TodoTask> {
  return prisma.todoTask.update({ where: { id }, data })
}

export async function deleteTask(id: string): Promise<void> {
  await prisma.todoTask.delete({ where: { id } })
}
