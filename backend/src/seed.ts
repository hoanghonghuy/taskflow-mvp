import { toJsonString } from './lib/json'
import * as listRepository from './repositories/listRepository'

const DEFAULT_LISTS = [
  { name: 'Inbox', color: '#3b82f6' },
  { name: 'Work', color: '#8b5cf6' },
  { name: 'Personal', color: '#10b981' },
] as const

export async function seedDefaultListsForUser(userId: string): Promise<void> {
  const existing = await listRepository.findListsByUserId(userId)
  if (existing.length > 0) return

  for (const list of DEFAULT_LISTS) {
    await listRepository.createList({
      name: list.name,
      color: list.color,
      members: toJsonString([]),
      user: { connect: { id: userId } },
    })
  }
}
