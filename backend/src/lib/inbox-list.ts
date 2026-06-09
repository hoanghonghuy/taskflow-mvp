import * as listRepository from '../repositories/listRepository'

/** Resolve the user's Inbox list id; falls back to literal 'inbox' if missing. */
export async function resolveInboxListId(userId: string): Promise<string> {
  const inbox = await listRepository.findInboxByUserId(userId)
  return inbox?.id ?? 'inbox'
}

export async function normalizeListId(userId: string, listId: unknown): Promise<string> {
  const raw = listId != null ? String(listId).trim() : ''
  if (!raw || raw === 'inbox') {
    return resolveInboxListId(userId)
  }
  return raw
}
