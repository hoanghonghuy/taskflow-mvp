import { z } from 'zod'
import { optionalDateStringSchema } from './common'

export const createCountdownSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  targetDate: z.string().datetime().refine(
    (date) => new Date(date) > new Date(),
    { message: 'Target date must be in the future' }
  ),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().default('#3b82f6'),
})

export const updateCountdownSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  targetDate: z.string().datetime().refine(
    (date) => new Date(date) > new Date(),
    { message: 'Target date must be in the future' }
  ).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
})
