import * as listRepository from '../repositories/listRepository'
import { AppError } from '../middleware/errorHandler'

/** Resolve the user's Inbox list id; throws if Inbox list is missing. */
export async function resolveInboxListId(userId: string): Promise<string> {
  const inbox = await listRepository.findInboxByUserId(userId)
  if (!inbox) {
    throw new AppError(400, 'invalid_request', 'Inbox list not found for user')
  }
  return inbox.id
}

export async function normalizeListId(userId: string, listId: unknown): Promise<string> {
  const raw = listId != null ? String(listId).trim() : ''
  if (!raw || raw === 'inbox') {
    return resolveInboxListId(userId)
  }

  const list = await listRepository.findListByIdAndUserId(raw, userId)
  if (!list) {
    throw new AppError(400, 'invalid_request', 'Invalid listId')
  }

  return raw
}
