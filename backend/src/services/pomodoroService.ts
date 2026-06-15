import { parseJsonObject, toJsonString } from '../lib/json'
import {
  mapSessionToDto,
  type PomodoroSessionDto,
  type PomodoroStateDto,
} from '../mappers/pomodoro.mapper'
import { ConcurrentUpdateError } from '../repositories/settingsRepository'
import * as pomodoroRepository from '../repositories/pomodoroRepository'
import * as settingsRepository from '../repositories/settingsRepository'

export async function listSessions(userId: string): Promise<PomodoroSessionDto[]> {
  const sessions = await pomodoroRepository.findSessionsByUserId(userId)
  return sessions.map(mapSessionToDto)
}

export async function getSession(userId: string, id: string): Promise<PomodoroSessionDto | null> {
  const session = await pomodoroRepository.findSessionByIdAndUserId(id, userId)
  return session ? mapSessionToDto(session) : null
}

export async function createSession(
  userId: string,
  body: Record<string, unknown>,
): Promise<PomodoroSessionDto> {
  const session = await pomodoroRepository.createSession({
    startTime: body.startTime ? new Date(String(body.startTime)) : new Date(),
    durationSeconds: typeof body.durationSeconds === 'number' ? body.durationSeconds : 0,
    type: String(body.type ?? 'focus'),
    taskId: body.taskId != null ? String(body.taskId) : null,
    habitId: body.habitId != null ? String(body.habitId) : null,
    user: { connect: { id: userId } },
  })
  return mapSessionToDto(session)
}

export async function getPomodoroState(userId: string): Promise<PomodoroStateDto | null> {
  const settings = await settingsRepository.findByUserId(userId)
  if (!settings?.pomodoroStateJson) return null

  const state = parseJsonObject<PomodoroStateDto>(settings.pomodoroStateJson)
  if (!state) return null

  let shouldPersist = false
  const baseUpdatedAt = settings.pomodoroStateUpdatedAt

  if (baseUpdatedAt && state.isActive && !state.isPaused) {
    const elapsedSeconds = Math.floor((Date.now() - baseUpdatedAt.getTime()) / 1000)
    if (elapsedSeconds > 0) {
      const remaining = state.remainingSeconds - elapsedSeconds
      if (remaining <= 0) {
        state.remainingSeconds = 0
        state.isActive = false
        state.isPaused = false
      } else {
        state.remainingSeconds = remaining
      }
      shouldPersist = true
    }
  }

  if (shouldPersist) {
    // Optimistic concurrency: chỉ ghi khi pomodoroStateUpdatedAt chưa đổi.
    // Nếu 2 request GET đồng thời, request sau sẽ throw ConcurrentUpdateError →
    // controller trả 409 Conflict, client retry.
    try {
      await settingsRepository.updateByUserId(
        userId,
        {
          pomodoroStateJson: toJsonString(state),
          pomodoroStateUpdatedAt: new Date(),
        },
        baseUpdatedAt,
      )
    } catch (error) {
      if (error instanceof ConcurrentUpdateError) {
        throw error
      }
      throw error
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

  await settingsRepository.upsertByUserId(userId, {
    pomodoroStateJson: toJsonString(normalized),
    pomodoroStateUpdatedAt: new Date(),
  })

  return normalized
}
