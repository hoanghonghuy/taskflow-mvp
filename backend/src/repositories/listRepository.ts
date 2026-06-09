import type { Prisma, TodoList } from '@prisma/client'
import { prisma } from '../lib/prisma'

export async function findListsByUserId(userId: string): Promise<TodoList[]> {
  return prisma.todoList.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function findListByIdAndUserId(id: string, userId: string): Promise<TodoList | null> {
  return prisma.todoList.findFirst({ where: { id, userId } })
}

export async function findInboxByUserId(userId: string): Promise<TodoList | null> {
  return prisma.todoList.findFirst({
    where: { userId, name: 'Inbox' },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createList(data: Prisma.TodoListCreateInput): Promise<TodoList> {
  return prisma.todoList.create({ data })
}

export async function updateList(id: string, data: Prisma.TodoListUpdateInput): Promise<TodoList> {
  return prisma.todoList.update({ where: { id }, data })
}

export async function deleteTasksByListId(userId: string, listId: string): Promise<void> {
  await prisma.todoTask.deleteMany({ where: { userId, listId } })
}

export async function deleteList(id: string): Promise<void> {
  await prisma.todoList.delete({ where: { id } })
}
