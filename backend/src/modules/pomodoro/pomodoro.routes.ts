import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { asyncHandler } from '../../middleware/errorHandler'
import * as pomodoroService from './pomodoro.service'

export const pomodoroSessionsRouter = Router()
export const pomodoroStateRouter = Router()

pomodoroSessionsRouter.use(requireAuth)
pomodoroStateRouter.use(requireAuth)

pomodoroSessionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const sessions = await pomodoroService.listSessions(req.userId!)
    res.status(200).json(sessions)
  }),
)

pomodoroSessionsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const session = await pomodoroService.getSession(req.userId!, req.params.id)
    if (!session) {
      res.status(404).json({ error: 'not_found', message: 'Session not found' })
      return
    }
    res.status(200).json(session)
  }),
)

pomodoroSessionsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const session = await pomodoroService.createSession(req.userId!, req.body)
    res.status(201).location(`/api/pomodoro/sessions/${session.id}`).json(session)
  }),
)

pomodoroStateRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const state = await pomodoroService.getPomodoroState(req.userId!)
    if (!state) {
      res.status(204).send()
      return
    }
    res.status(200).json(state)
  }),
)

pomodoroStateRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const state = await pomodoroService.updatePomodoroState(req.userId!, req.body)
    res.status(200).json(state)
  }),
)
