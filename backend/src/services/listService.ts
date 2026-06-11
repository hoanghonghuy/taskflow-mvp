import type { Prisma } from '@prisma/client'
import { toJsonString } from '../lib/json'
import { mapListToDto, type ListDto } from '../mappers/list.mapper'
import * as listRepository from '../repositories/listRepository'
import { prisma } from '../lib/prisma'

async function validateMembers(memberIds: string[]): Promise<void> {
  if (memberIds.length === 0) return

  const existingUsers = await prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: { id: true },
  })

  const existingIds = new Set(existingUsers.map((u) => u.id))
  const invalidIds = memberIds.filter((id) => !existingIds.has(id))

  if (invalidIds.length > 0) {
    throw new Error(`Invalid user IDs: ${invalidIds.join(', ')}`)
  }
}

export async function listLists(userId: string): Promise<ListDto[]> {
  const lists = await listRepository.findListsByUserId(userId)
  return lists.map(mapListToDto)
}

export async function getList(userId: string, id: string): Promise<ListDto | null> {
  const list = await listRepository.findListByIdAndUserId(id, userId)
  return list ? mapListToDto(list) : null
}

export async function createList(userId: string, body: Record<string, unknown>): Promise<ListDto> {
  const name = String(body.name ?? '').trim()
  const color = String(body.color ?? '#3b82f6')
  const members = Array.isArray(body.members) ? body.members.map(String) : []

  // Validate members exist
  await validateMembers(members)

  const list = await listRepository.createList({
    name: name || 'Untitled',
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
  if ('name' in body && body.name != null) data.name = String(body.name).trim()
  if ('color' in body && body.color != null) data.color = String(body.color)
  if ('members' in body && body.members != null) {
    const members = Array.isArray(body.members) ? body.members.map(String) : []
    // Validate members exist
    await validateMembers(members)
    data.members = toJsonString(members)
  }

  const updated = await listRepository.updateList(id, data)
  return mapListToDto(updated)
}

export async function deleteList(userId: string, id: string): Promise<boolean> {
  const existing = await listRepository.findListByIdAndUserId(id, userId)
  if (!existing) return false

  await listRepository.deleteTasksByListId(userId, id)
  await listRepository.deleteList(id)
  return true
}
