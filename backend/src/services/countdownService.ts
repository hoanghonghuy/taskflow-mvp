import type { Prisma } from '@prisma/client'
import { mapCountdownToDto, type CountdownDto } from '../mappers/countdown.mapper'
import * as countdownRepository from '../repositories/countdownRepository'

export async function listCountdowns(userId: string): Promise<CountdownDto[]> {
  const events = await countdownRepository.findCountdownsByUserId(userId)
  return events.map(mapCountdownToDto)
}

export async function getCountdown(userId: string, id: string): Promise<CountdownDto | null> {
  const event = await countdownRepository.findCountdownByIdAndUserId(id, userId)
  return event ? mapCountdownToDto(event) : null
}

export async function createCountdown(
  userId: string,
  body: Record<string, unknown>,
): Promise<CountdownDto> {
  const title = String(body.title ?? '').trim() || 'Untitled'
  const targetDate = body.targetDate ? new Date(String(body.targetDate)) : new Date()
  const color = String(body.color ?? '#3b82f6')

  const event = await countdownRepository.createCountdown({
    title,
    targetDate,
    color,
    user: { connect: { id: userId } },
  })

  return mapCountdownToDto(event)
}

export async function updateCountdown(
  userId: string,
  id: string,
  body: Record<string, unknown>,
): Promise<CountdownDto | null> {
  const existing = await countdownRepository.findCountdownByIdAndUserId(id, userId)
  if (!existing) return null

  const data: Prisma.CountdownEventUpdateInput = {}
  if ('title' in body && body.title != null) data.title = String(body.title).trim()
  if ('targetDate' in body && body.targetDate != null) {
    data.targetDate = new Date(String(body.targetDate))
  }
  if ('color' in body && body.color != null) data.color = String(body.color)

  const updated = await countdownRepository.updateCountdown(id, data)
  return mapCountdownToDto(updated)
}

export async function deleteCountdown(userId: string, id: string): Promise<boolean> {
  const existing = await countdownRepository.findCountdownByIdAndUserId(id, userId)
  if (!existing) return false
  await countdownRepository.deleteCountdown(id)
  return true
}
