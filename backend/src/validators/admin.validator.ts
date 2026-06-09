import { z } from 'zod'
import { USER_ROLES } from '../types/roles'

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
})

export const updateUserRoleBodySchema = z.object({
  role: z.enum(USER_ROLES),
})
