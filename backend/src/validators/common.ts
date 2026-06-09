import { z } from 'zod'

export const prioritySchema = z.enum(['none', 'low', 'medium', 'high', 'urgent'])

export const optionalDateStringSchema = z.union([z.string(), z.null()]).optional()

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
