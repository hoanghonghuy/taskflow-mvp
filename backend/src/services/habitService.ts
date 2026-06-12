import type { Prisma } from '@prisma/client'
import { todayDateString } from '../lib/date'
import { parseJsonArray, toJsonString } from '../lib/json'
import { AppError } from '../middleware/errorHandler'
import { mapHabitToDto, type HabitDto } from '../mappers/habit.mapper'
import * as habitRepository from '../repositories/habitRepository'

function todayUtc(): string {
  return todayDateString()
}

function parseDateOrToday(date?: string | null): string {
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  return todayUtc()
}

export async function listHabits(userId: string): Promise<HabitDto[]> {
  const habits = await habitRepository.findHabitsByUserId(userId)
  return habits.map(mapHabitToDto)
}

export async function getHabit(userId: string, id: string): Promise<HabitDto | null> {
  const habit = await habitRepository.findHabitByIdAndUserId(id, userId)
  return habit ? mapHabitToDto(habit) : null
}

export async function createHabit(userId: string, body: Record<string, unknown>): Promise<HabitDto> {
  const name = String(body.name ?? '').trim() || 'Untitled habit'
  const habit = await habitRepository.createHabit({
    name,
    completions: '[]',
    user: { connect: { id: userId } },
  })
  return mapHabitToDto(habit)
}

export async function updateHabit(
  userId: string,
  id: string,
  body: Record<string, unknown>,
): Promise<HabitDto | null> {
  const existing = await habitRepository.findHabitByIdAndUserId(id, userId)
  if (!existing) return null

  const data: Prisma.HabitUpdateInput = {}
  if ('name' in body && body.name != null) {
    const name = String(body.name).trim()
    if (!name) throw new AppError(400, 'invalid_request', 'Name must not be empty')
    data.name = name
  }

  const updated = await habitRepository.updateHabit(id, data)
  return mapHabitToDto(updated)
}

export async function deleteHabit(userId: string, id: string): Promise<boolean> {
  const existing = await habitRepository.findHabitByIdAndUserId(id, userId)
  if (!existing) return false
  await habitRepository.deleteHabit(id)
  return true
}

export async function completeHabit(userId: string, id: string, date?: string): Promise<boolean> {
  const habit = await habitRepository.findHabitByIdAndUserId(id, userId)
  if (!habit) return false

  const targetDate = parseDateOrToday(date)
  const completions = parseJsonArray<string>(habit.completions)
  if (!completions.includes(targetDate)) {
    completions.push(targetDate)
    await habitRepository.updateHabit(id, { completions: toJsonString(completions) })
  }

  return true
}

export async function uncompleteHabit(
  userId: string,
  id: string,
  date?: string,
): Promise<boolean> {
  const habit = await habitRepository.findHabitByIdAndUserId(id, userId)
  if (!habit) return false

  const targetDate = parseDateOrToday(date)
  const completions = parseJsonArray<string>(habit.completions).filter((d) => d !== targetDate)
  await habitRepository.updateHabit(id, { completions: toJsonString(completions) })

  return true
}
