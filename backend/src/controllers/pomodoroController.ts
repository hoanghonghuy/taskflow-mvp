import type { Request, Response } from 'express'
import { sendCreated, sendError, sendSuccess } from '../lib/response'
import * as pomodoroService from '../services/pomodoroService'
import {
  createPomodoroSessionSchema,
  updatePomodoroStateSchema,
} from '../validators/pomodoro.validator'

export async function listSessions(req: Request, res: Response): Promise<void> {
  const sessions = await pomodoroService.listSessions(req.userId!)
  sendSuccess(res, sessions)
}

export async function getSession(req: Request, res: Response): Promise<void> {
  const session = await pomodoroService.getSession(req.userId!, req.params.id)
  if (!session) {
    sendError(res, 404, 'not_found', 'Session not found')
    return
  }
  sendSuccess(res, session)
}

export async function createSession(req: Request, res: Response): Promise<void> {
  const body = createPomodoroSessionSchema.parse(req.body ?? {})
  const session = await pomodoroService.createSession(req.userId!, body)
  sendCreated(res, session, `/api/pomodoro/sessions/${session.id}`)
}

export async function getState(req: Request, res: Response): Promise<void> {
  const state = await pomodoroService.getPomodoroState(req.userId!)
  sendSuccess(res, state)
}

export async function updateState(req: Request, res: Response): Promise<void> {
  const body = updatePomodoroStateSchema.parse(req.body ?? {})
  const state = await pomodoroService.updatePomodoroState(req.userId!, body)
  sendSuccess(res, state)
}

