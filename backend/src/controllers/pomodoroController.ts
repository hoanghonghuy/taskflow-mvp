import type { Request, Response } from 'express'
import * as pomodoroService from '../services/pomodoroService'

export async function listSessions(req: Request, res: Response): Promise<void> {
  const sessions = await pomodoroService.listSessions(req.userId!)
  res.status(200).json(sessions)
}

export async function getSession(req: Request, res: Response): Promise<void> {
  const session = await pomodoroService.getSession(req.userId!, req.params.id)
  if (!session) {
    res.status(404).json({ error: 'not_found', message: 'Session not found' })
    return
  }
  res.status(200).json(session)
}

export async function createSession(req: Request, res: Response): Promise<void> {
  const session = await pomodoroService.createSession(req.userId!, req.body ?? {})
  res.status(201).location(`/api/pomodoro/sessions/${session.id}`).json(session)
}

export async function getState(req: Request, res: Response): Promise<void> {
  const state = await pomodoroService.getPomodoroState(req.userId!)
  if (!state) {
    res.status(204).send()
    return
  }
  res.status(200).json(state)
}

export async function updateState(req: Request, res: Response): Promise<void> {
  const state = await pomodoroService.updatePomodoroState(req.userId!, req.body ?? {})
  res.status(200).json(state)
}
