import type { Prisma, TodoList } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { isListAccessible, membersContainUserId } from '../lib/list-access'

export async function findListsByUserId(userId: string): Promise<TodoList[]> {
  return prisma.todoList.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
}

/** Lists owned by user + lists shared with user as member. */
export async function findListsAccessibleByUserId(userId: string): Promise<TodoList[]> {
  const [owned, shared] = await Promise.all([
    findListsByUserId(userId),
    prisma.todoList.findMany({
      where: {
        userId: { not: userId },
        members: membersContainUserId(userId),
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const seen = new Set<string>()
  return [...owned, ...shared].filter((list) => {
    if (seen.has(list.id)) return false
    seen.add(list.id)
    return true
  })
}

export async function findSharedListIdsForMember(userId: string): Promise<string[]> {
  const shared = await prisma.todoList.findMany({
    where: {
      userId: { not: userId },
      members: membersContainUserId(userId),
    },
    select: { id: true },
  })
  return shared.map((list) => list.id)
}

export async function findListByIdAndUserId(id: string, userId: string): Promise<TodoList | null> {
  return prisma.todoList.findFirst({ where: { id, userId } })
}

export async function findListByIdAccessible(id: string, userId: string): Promise<TodoList | null> {
  const list = await prisma.todoList.findUnique({ where: { id } })
  if (!list || !isListAccessible(list, userId)) return null
  return list
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
