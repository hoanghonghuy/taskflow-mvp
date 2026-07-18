import type { List } from '@/types'

/** True when the current user is a collaborator on someone else's list. */
export function isSharedListMember(
  list: Pick<List, 'ownerUserId'> | null | undefined,
  userId: string | null | undefined,
): boolean {
  if (!list?.ownerUserId || !userId) return false
  return list.ownerUserId !== userId
}

/** True when the user owns the list (or ownership is unknown / unset). */
export function isOwnedList(
  list: Pick<List, 'ownerUserId'> | null | undefined,
  userId: string | null | undefined,
): boolean {
  return !isSharedListMember(list, userId)
}
