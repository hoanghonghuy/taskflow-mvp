import type { CountdownEvent } from '@prisma/client'

export interface CountdownDto {
  id: string
  title: string
  targetDate: string
  color: string
  createdAt: string
}

export function mapCountdownToDto(event: CountdownEvent): CountdownDto {
  return {
    id: event.id,
    title: event.title,
    targetDate: event.targetDate.toISOString(),
    color: event.color,
    createdAt: event.createdAt.toISOString(),
  }
}
