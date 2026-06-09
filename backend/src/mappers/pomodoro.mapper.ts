import type { PomodoroSession } from '@prisma/client'

export interface PomodoroSessionDto {
  id: string
  startTime: string
  durationSeconds: number
  type: string
  taskId: string | null
  habitId: string | null
}

export interface PomodoroStateDto {
  isActive: boolean
  isPaused: boolean
  remainingSeconds: number
  currentSession: string
  focusedTaskId: string | null
  focusedHabitId: string | null
  sessionsCompleted: number
}

export function mapSessionToDto(session: PomodoroSession): PomodoroSessionDto {
  return {
    id: session.id,
    startTime: session.startTime.toISOString(),
    durationSeconds: session.durationSeconds,
    type: session.type,
    taskId: session.taskId,
    habitId: session.habitId,
  }
}
