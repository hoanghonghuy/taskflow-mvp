import { Router } from 'express'
import * as pomodoroController from '../controllers/pomodoroController'
import { requireAuth } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

export const pomodoroSessionsRouter = Router()
export const pomodoroStateRouter = Router()

pomodoroSessionsRouter.use(requireAuth)
pomodoroStateRouter.use(requireAuth)

pomodoroSessionsRouter.get('/', asyncHandler(pomodoroController.listSessions))
pomodoroSessionsRouter.get('/:id', asyncHandler(pomodoroController.getSession))
pomodoroSessionsRouter.post('/', asyncHandler(pomodoroController.createSession))

pomodoroStateRouter.get('/', asyncHandler(pomodoroController.getState))
pomodoroStateRouter.put('/', asyncHandler(pomodoroController.updateState))
