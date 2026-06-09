import { z } from 'zod'
import { USER_ROLES } from '../types/roles'

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  role: z.enum(USER_ROLES).optional(),
})

export const updateUserBodySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().email().max(255).optional(),
  })
  .refine((body) => body.name !== undefined || body.email !== undefined, {
    message: 'At least one field is required',
  })
