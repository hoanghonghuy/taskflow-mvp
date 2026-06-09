import { z } from 'zod'
import { isoDateSchema } from './common'

export const createHabitSchema = z.object({
  name: z.string().optional(),
})

export const updateHabitSchema = z.object({
  name: z.string().optional(),
})

export const completeHabitSchema = z.object({
  date: isoDateSchema.optional(),
})
