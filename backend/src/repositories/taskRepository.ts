import type { Prisma, TodoTask } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { isListAccessible } from '../lib/list-access'
import * as listRepository from './listRepository'

type TxClient = Prisma.TransactionClient

export async function findTasksByUserId(userId: string): Promise<TodoTask[]> {
  return prisma.todoTask.findMany({
    where: { userId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })
}

/** Own tasks + tasks in lists shared with user as member. */
export async function findTasksAccessibleByUserId(userId: string): Promise<TodoTask[]> {
  const sharedListIds = await listRepository.findSharedListIdsForMember(userId)
  const where =
    sharedListIds.length > 0
      ? {
          OR: [{ userId }, { listId: { in: sharedListIds } }],
        }
      : { userId }

  return prisma.todoTask.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })
}

/** Tóm tắt task cho AI briefing: aggregate + top N due today / overdue.
 *  Tránh load hết tasks về memory khi user có nhiều task. */
export async function findTasksBriefingSummary(
  userId: string,
  options: { todayTopN: number; dueBefore: Date },
): Promise<{
  total: number
  completed: number
  pending: number
  dueTodayTop: TodoTask[]
}> {
  const [total, completed, dueTodayTop] = await Promise.all([
    prisma.todoTask.count({ where: { userId } }),
    prisma.todoTask.count({ where: { userId, completed: true } }),
    prisma.todoTask.findMany({
      where: {
        userId,
        completed: false,
        dueDate: { lte: options.dueBefore, not: null },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: options.todayTopN,
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
      },
    }),
  ])
  return {
    total,
    completed,
    pending: total - completed,
    dueTodayTop: dueTodayTop as unknown as TodoTask[],
  }
}

export async function findMaxSortOrder(userId: string, tx: TxClient = prisma): Promise<number> {
  const row = await tx.todoTask.aggregate({
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

export async function findTaskByIdAccessible(id: string, userId: string): Promise<TodoTask | null> {
  const task = await prisma.todoTask.findUnique({ where: { id } })
  if (!task) return null
  if (task.userId === userId) return task

  const list = await listRepository.findListByIdAccessible(task.listId, userId)
  if (!list || list.userId === userId) return null
  return task
}

export async function createTask(
  data: Prisma.TodoTaskCreateInput,
  tx: TxClient = prisma,
): Promise<TodoTask> {
  return tx.todoTask.create({ data })
}

export async function updateTask(id: string, data: Prisma.TodoTaskUpdateInput): Promise<TodoTask> {
  return prisma.todoTask.update({ where: { id }, data })
}

export async function deleteTask(id: string): Promise<void> {
  await prisma.todoTask.delete({ where: { id } })
}
