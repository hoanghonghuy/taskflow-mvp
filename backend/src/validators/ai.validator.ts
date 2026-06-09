import { z } from 'zod'

export const briefingSchema = z.object({
  language: z.string().optional(),
})

export const analyzeTaskSchema = z.object({
  text: z.string(),
  language: z.string().optional(),
})

export const generateSubtasksSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  language: z.string().optional(),
})

export const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      text: z.string(),
    }),
  ),
  language: z.string().optional(),
  thinkingMode: z.boolean().optional(),
  searchGrounding: z.boolean().optional(),
})
