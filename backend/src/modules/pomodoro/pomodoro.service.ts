import { prisma } from '../../lib/prisma'
import { parseJsonObject, toJsonString } from '../../lib/json'
import {
  mapSessionToDto,
  type PomodoroSessionDto,
  type PomodoroStateDto,
} from '../../mappers/pomodoro.mapper'
import { defaultSettingsData } from '../../mappers/settings.mapper'

async function getOrCreateSettings(userId: string) {
  let settings = await prisma.userSettings.findUnique({ where: { userId } })
  if (!settings) {
    settings = await prisma.userSettings.create({ data: defaultSettingsData(userId) })
  }
  return settings
}

export async function listSessions(userId: string): Promise<PomodoroSessionDto[]> {
  const sessions = await prisma.pomodoroSession.findMany({
    where: { userId },
    orderBy: { startTime: 'desc' },
  })
  return sessions.map(mapSessionToDto)
}

export async function getSession(userId: string, id: string): Promise<PomodoroSessionDto | null> {
  const session = await prisma.pomodoroSession.findFirst({ where: { id, userId } })
  return session ? mapSessionToDto(session) : null
}

export async function createSession(
  userId: string,
  body: Record<string, unknown>,
): Promise<PomodoroSessionDto> {
  const session = await prisma.pomodoroSession.create({
    data: {
      startTime: body.startTime ? new Date(String(body.startTime)) : new Date(),
      durationSeconds: typeof body.durationSeconds === 'number' ? body.durationSeconds : 0,
      type: String(body.type ?? 'focus'),
      taskId: body.taskId != null ? String(body.taskId) : null,
      habitId: body.habitId != null ? String(body.habitId) : null,
      userId,
    },
  })
  return mapSessionToDto(session)
}

export async function getPomodoroState(userId: string): Promise<PomodoroStateDto | null> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } })
  if (!settings?.pomodoroStateJson) return null

  const state = parseJsonObject<PomodoroStateDto>(settings.pomodoroStateJson)
  if (!state) return null

  if (settings.pomodoroStateUpdatedAt && state.isActive && !state.isPaused) {
    const elapsedSeconds = Math.floor(
      (Date.now() - settings.pomodoroStateUpdatedAt.getTime()) / 1000,
    )
    if (elapsedSeconds > 0) {
      const remaining = state.remainingSeconds - elapsedSeconds
      if (remaining <= 0) {
        state.remainingSeconds = 0
        state.isActive = false
        state.isPaused = false
      } else {
        state.remainingSeconds = remaining
      }
    }
  }

  return state
}

export async function updatePomodoroState(
  userId: string,
  body: Record<string, unknown>,
): Promise<PomodoroStateDto> {
  const normalized: PomodoroStateDto = {
    isActive: Boolean(body.isActive),
    isPaused: Boolean(body.isPaused),
    remainingSeconds:
      typeof body.remainingSeconds === 'number' && body.remainingSeconds >= 0
        ? body.remainingSeconds
        : 0,
    currentSession:
      typeof body.currentSession === 'string' && body.currentSession.trim()
        ? body.currentSession.trim()
        : 'focus',
    focusedTaskId:
      body.focusedTaskId != null && String(body.focusedTaskId).trim()
        ? String(body.focusedTaskId).trim()
        : null,
    focusedHabitId:
      body.focusedHabitId != null && String(body.focusedHabitId).trim()
        ? String(body.focusedHabitId).trim()
        : null,
    sessionsCompleted:
      typeof body.sessionsCompleted === 'number' && body.sessionsCompleted >= 0
        ? body.sessionsCompleted
        : 0,
  }

  await getOrCreateSettings(userId)
  await prisma.userSettings.update({
    where: { userId },
    data: {
      pomodoroStateJson: toJsonString(normalized),
      pomodoroStateUpdatedAt: new Date(),
    },
  })

  return normalized
}
