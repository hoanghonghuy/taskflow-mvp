import type { Prisma } from '@prisma/client'
import { toJsonString } from '../lib/json'
import { parseListMembers } from '../lib/list-access'
import { AppError } from '../middleware/errorHandler'
import { mapListToDto, type ListDto } from '../mappers/list.mapper'
import * as listRepository from '../repositories/listRepository'
import { prisma } from '../lib/prisma'

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/

async function validateMembers(memberIds: string[]): Promise<void> {
  if (memberIds.length === 0) return

  const existingUsers = await prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: { id: true },
  })

  const existingIds = new Set(existingUsers.map((u) => u.id))
  const invalidIds = memberIds.filter((id) => !existingIds.has(id))

  if (invalidIds.length > 0) {
    throw new AppError(400, 'invalid_request', `Invalid user IDs: ${invalidIds.join(', ')}`)
  }
}

function normalizeColor(input: unknown, fallback: string): string {
  const value = input == null ? fallback : String(input).trim()
  if (!HEX_COLOR_RE.test(value)) {
    throw new AppError(400, 'invalid_request', 'Invalid color format (expected #RRGGBB)')
  }
  return value
}

export async function listLists(userId: string): Promise<ListDto[]> {
  const lists = await listRepository.findListsAccessibleByUserId(userId)
  return lists.map(mapListToDto)
}

export async function getList(userId: string, id: string): Promise<ListDto | null> {
  const list = await listRepository.findListByIdAccessible(id, userId)
  return list ? mapListToDto(list) : null
}

export async function createList(userId: string, body: Record<string, unknown>): Promise<ListDto> {
  const name = String(body.name ?? '').trim()
  const color = normalizeColor(body.color, '#3b82f6')
  const members = Array.isArray(body.members) ? body.members.map(String) : []

  if (!name) {
    throw new AppError(400, 'invalid_request', 'Name must not be empty')
  }

  // Validate members exist
  await validateMembers(members)

  const list = await listRepository.createList({
    name,
    color,
    members: toJsonString(members),
    user: { connect: { id: userId } },
  })

  return mapListToDto(list)
}

export async function updateList(
  userId: string,
  id: string,
  body: Record<string, unknown>,
): Promise<ListDto | null> {
  const existing = await listRepository.findListByIdAndUserId(id, userId)
  if (!existing) return null

  const data: Prisma.TodoListUpdateInput = {}
  if ('name' in body && body.name != null) {
    const name = String(body.name).trim()
    if (!name) throw new AppError(400, 'invalid_request', 'Name must not be empty')
    data.name = name
  }
  if ('color' in body && body.color != null) {
    data.color = normalizeColor(body.color, existing.color)
  }
  if ('members' in body && body.members != null) {
    const members = Array.isArray(body.members) ? body.members.map(String) : []
    // Validate members exist
    await validateMembers(members)
    data.members = toJsonString(members)
  }

  const updated = await listRepository.updateList(id, data)
  return mapListToDto(updated)
}

/** Atomically add a member using current DB members (avoids last-write-wins races). */
export async function addListMember(
  userId: string,
  id: string,
  memberUserId: string,
): Promise<ListDto | null> {
  const existing = await listRepository.findListByIdAndUserId(id, userId)
  if (!existing) return null

  if (memberUserId === userId) {
    throw new AppError(400, 'invalid_request', 'Cannot invite yourself')
  }

  await validateMembers([memberUserId])

  const current = parseListMembers(existing.members)
  if (current.includes(memberUserId)) {
    return mapListToDto(existing)
  }

  const updated = await listRepository.updateList(id, {
    members: toJsonString([...current, memberUserId]),
  })
  return mapListToDto(updated)
}

/** Atomically remove a member using current DB members. */
export async function removeListMember(
  userId: string,
  id: string,
  memberUserId: string,
): Promise<ListDto | null> {
  const existing = await listRepository.findListByIdAndUserId(id, userId)
  if (!existing) return null

  const current = parseListMembers(existing.members)
  if (!current.includes(memberUserId)) {
    return mapListToDto(existing)
  }

  const updated = await listRepository.updateList(id, {
    members: toJsonString(current.filter((m) => m !== memberUserId)),
  })
  return mapListToDto(updated)
}

export async function deleteList(userId: string, id: string): Promise<boolean> {
  const existing = await listRepository.findListByIdAndUserId(id, userId)
  if (existing) {
    if (existing.name === 'Inbox') {
      throw new AppError(400, 'invalid_request', 'Cannot delete the Inbox list')
    }

    await listRepository.deleteTasksByListId(userId, id)
    await listRepository.deleteList(id)
    return true
  }

  const accessible = await listRepository.findListByIdAccessible(id, userId)
  if (accessible) {
    throw new AppError(403, 'forbidden', 'You do not have permission to delete this list')
  }

  return false
}
