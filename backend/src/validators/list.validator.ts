import { z } from 'zod'

export const createListSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  members: z.array(z.string()).optional(),
})

export const updateListSchema = createListSchema.partial()
