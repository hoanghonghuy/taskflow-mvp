import type { Habit } from '@prisma/client'
import { parseJsonArray } from '../lib/json'

export interface HabitDto {
  id: string
  name: string
  completions: string[]
  createdAt: string
}

export function mapHabitToDto(habit: Habit): HabitDto {
  return {
    id: habit.id,
    name: habit.name,
    completions: parseJsonArray<string>(habit.completions),
    createdAt: habit.createdAt.toISOString(),
  }
}
