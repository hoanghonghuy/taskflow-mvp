import { prisma } from '../../lib/prisma'
import { mapCountdownToDto, type CountdownDto } from '../../mappers/countdown.mapper'

export async function listCountdowns(userId: string): Promise<CountdownDto[]> {
  const events = await prisma.countdownEvent.findMany({
    where: { userId },
    orderBy: { targetDate: 'asc' },
  })
  return events.map(mapCountdownToDto)
}

export async function getCountdown(userId: string, id: string): Promise<CountdownDto | null> {
  const event = await prisma.countdownEvent.findFirst({ where: { id, userId } })
  return event ? mapCountdownToDto(event) : null
}

export async function createCountdown(
  userId: string,
  body: Record<string, unknown>,
): Promise<CountdownDto> {
  const title = String(body.title ?? '').trim() || 'Untitled'
  const targetDate = body.targetDate ? new Date(String(body.targetDate)) : new Date()
  const color = String(body.color ?? '#3b82f6')

  const event = await prisma.countdownEvent.create({
    data: { title, targetDate, color, userId },
  })

  return mapCountdownToDto(event)
}

export async function updateCountdown(
  userId: string,
  id: string,
  body: Record<string, unknown>,
): Promise<CountdownDto | null> {
  const existing = await prisma.countdownEvent.findFirst({ where: { id, userId } })
  if (!existing) return null

  const data: Record<string, unknown> = {}
  if ('title' in body && body.title != null) data.title = String(body.title).trim()
  if ('targetDate' in body && body.targetDate != null) {
    data.targetDate = new Date(String(body.targetDate))
  }
  if ('color' in body && body.color != null) data.color = String(body.color)

  const updated = await prisma.countdownEvent.update({ where: { id }, data })
  return mapCountdownToDto(updated)
}

export async function deleteCountdown(userId: string, id: string): Promise<boolean> {
  const existing = await prisma.countdownEvent.findFirst({ where: { id, userId } })
  if (!existing) return false
  await prisma.countdownEvent.delete({ where: { id } })
  return true
}
