import type { TodoList } from '@prisma/client'
import { parseJsonArray } from '../lib/json'

export interface ListDto {
  id: string
  name: string
  color: string
  members: string[]
  ownerUserId: string
}

export function mapListToDto(list: TodoList): ListDto {
  return {
    id: list.id,
    name: list.name,
    color: list.color,
    members: parseJsonArray<string>(list.members),
    ownerUserId: list.userId,
  }
}
