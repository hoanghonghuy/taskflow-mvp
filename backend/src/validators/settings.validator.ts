import { z } from 'zod'

const boardColumnSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  listId: z.string().min(1),
})

export const updateSettingsSchema = z
  .object({
    language: z.string().min(1).optional(),
    theme: z.string().min(1).optional(),
    notifications: z.boolean().optional(),
    soundEnabled: z.boolean().optional(),
    autoStartPomodoro: z.boolean().optional(),
    defaultPriority: z.string().min(1).optional(),
    defaultListId: z.string().min(1).optional(),
    bottomNavActions: z.array(z.string()).optional(),
    geminiApiKey: z.string().nullable().optional(),
    pomodoroSettings: z
      .object({
        focusDuration: z.number().int().positive().optional(),
        shortBreakDuration: z.number().int().positive().optional(),
        longBreakDuration: z.number().int().positive().optional(),
        sessionsUntilLongBreak: z.number().int().positive().optional(),
      })
      .optional(),
    boardColumns: z.array(boardColumnSchema).optional(),
  })
