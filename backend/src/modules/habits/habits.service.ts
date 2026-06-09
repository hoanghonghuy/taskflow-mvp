import { prisma } from '../../lib/prisma'
import { parseJsonArray, toJsonString } from '../../lib/json'
import { mapHabitToDto, type HabitDto } from '../../mappers/habit.mapper'

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function parseDateOrToday(date?: string | null): string {
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  return todayUtc()
}

export async function listHabits(userId: string): Promise<HabitDto[]> {
  const habits = await prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })
  return habits.map(mapHabitToDto)
}

export async function getHabit(userId: string, id: string): Promise<HabitDto | null> {
  const habit = await prisma.habit.findFirst({ where: { id, userId } })
  return habit ? mapHabitToDto(habit) : null
}

export async function createHabit(userId: string, body: Record<string, unknown>): Promise<HabitDto> {
  const name = String(body.name ?? '').trim() || 'Untitled habit'
  const habit = await prisma.habit.create({
    data: { name, completions: '[]', userId },
  })
  return mapHabitToDto(habit)
}

export async function updateHabit(
  userId: string,
  id: string,
  body: Record<string, unknown>,
): Promise<HabitDto | null> {
  const existing = await prisma.habit.findFirst({ where: { id, userId } })
  if (!existing) return null

  const data: Record<string, unknown> = {}
  if ('name' in body && body.name != null) data.name = String(body.name).trim()

  const updated = await prisma.habit.update({ where: { id }, data })
  return mapHabitToDto(updated)
}

export async function deleteHabit(userId: string, id: string): Promise<boolean> {
  const existing = await prisma.habit.findFirst({ where: { id, userId } })
  if (!existing) return false
  await prisma.habit.delete({ where: { id } })
  return true
}

export async function completeHabit(userId: string, id: string, date?: string): Promise<boolean> {
  const habit = await prisma.habit.findFirst({ where: { id, userId } })
  if (!habit) return false

  const targetDate = parseDateOrToday(date)
  const completions = parseJsonArray<string>(habit.completions)
  if (!completions.includes(targetDate)) {
    completions.push(targetDate)
    await prisma.habit.update({
      where: { id },
      data: { completions: toJsonString(completions) },
    })
  }

  return true
}

export async function uncompleteHabit(
  userId: string,
  id: string,
  date?: string,
): Promise<boolean> {
  const habit = await prisma.habit.findFirst({ where: { id, userId } })
  if (!habit) return false

  const targetDate = parseDateOrToday(date)
  const completions = parseJsonArray<string>(habit.completions).filter((d) => d !== targetDate)
  await prisma.habit.update({
    where: { id },
    data: { completions: toJsonString(completions) },
  })

  return true
}
