import { z } from 'zod'
import { optionalDateStringSchema } from './common'

export const createCountdownSchema = z.object({
  title: z.string().optional(),
  targetDate: optionalDateStringSchema,
  color: z.string().optional(),
})

export const updateCountdownSchema = createCountdownSchema.partial()
