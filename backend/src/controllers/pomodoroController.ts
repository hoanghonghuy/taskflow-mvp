import type { Request, Response } from 'express'
import { sendCreated, sendError, sendNoContent, sendSuccess } from '../lib/response'
import * as pomodoroService from '../services/pomodoroService'

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
  const session = await pomodoroService.createSession(req.userId!, req.body ?? {})
  sendCreated(res, session, `/api/pomodoro/sessions/${session.id}`)
}

export async function getState(req: Request, res: Response): Promise<void> {
  const state = await pomodoroService.getPomodoroState(req.userId!)
  if (!state) {
    sendNoContent(res)
    return
  }
  sendSuccess(res, state)
}

export async function updateState(req: Request, res: Response): Promise<void> {
  const state = await pomodoroService.updatePomodoroState(req.userId!, req.body ?? {})
  sendSuccess(res, state)
}
