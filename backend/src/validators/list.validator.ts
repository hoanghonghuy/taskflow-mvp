import { z } from 'zod'

export const createListSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  members: z.array(z.string().uuid('Invalid user ID format')).max(50, 'Maximum 50 members allowed').optional(),
})

export const updateListSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  members: z.array(z.string().uuid('Invalid user ID format')).max(50, 'Maximum 50 members allowed').optional(),
})

export const addListMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
})
