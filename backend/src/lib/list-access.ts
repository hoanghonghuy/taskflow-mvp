import type { TodoList } from '@prisma/client'
import { parseJsonArray } from './json'

export function parseListMembers(membersJson: string): string[] {
  return parseJsonArray<string>(membersJson)
}

export function isListOwner(list: TodoList, userId: string): boolean {
  return list.userId === userId
}

export function isListAccessible(list: TodoList, userId: string): boolean {
  if (isListOwner(list, userId)) return true
  return parseListMembers(list.members).includes(userId)
}

/** Prisma `contains` filter cho field TEXT lưu JSON array member IDs. */
export function membersContainUserId(userId: string): { contains: string } {
  return { contains: `"${userId}"` }
}
