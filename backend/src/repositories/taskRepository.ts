import type { Prisma, TodoTask } from '@prisma/client'
import { prisma } from '../lib/prisma'

export async function findTasksByUserId(userId: string): Promise<TodoTask[]> {
  return prisma.todoTask.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
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
