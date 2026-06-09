import { z } from 'zod'
import { optionalDateStringSchema, prioritySchema } from './common'

const subtaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
})

const commentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  content: z.string(),
  timestamp: z.union([z.string(), z.number(), z.date()]),
})

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title must not be empty'),
  description: z.string().nullable().optional(),
  dueDate: optionalDateStringSchema,
  priority: prioritySchema.optional(),
  listId: z.string().min(1).optional(),
  columnId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  recurrence: z.record(z.unknown()).nullable().optional(),
  reminderMinutes: z.number().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  subtasks: z.array(subtaskSchema).optional(),
  comments: z.array(commentSchema).optional(),
})

export const updateTaskSchema = createTaskSchema
  .partial()
  .extend({ completed: z.boolean().optional() })
