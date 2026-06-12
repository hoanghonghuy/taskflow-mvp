import { z } from 'zod'

export const createPomodoroSessionSchema = z.object({
  startTime: z.string().min(1).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  type: z.string().min(1).optional(),
  taskId: z.string().nullable().optional(),
  habitId: z.string().nullable().optional(),
})

export const updatePomodoroStateSchema = z.object({
  isActive: z.boolean().optional(),
  isPaused: z.boolean().optional(),
  remainingSeconds: z.number().int().min(0).optional(),
  currentSession: z.enum(['focus', 'shortBreak', 'longBreak']).optional(),
  focusedTaskId: z.string().nullable().optional(),
  focusedHabitId: z.string().nullable().optional(),
  sessionsCompleted: z.number().int().min(0).optional(),
})
