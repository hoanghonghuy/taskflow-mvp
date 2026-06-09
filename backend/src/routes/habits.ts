import { Router } from 'express'
import * as habitController from '../controllers/habitController'
import { requireAuth } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

export const habitsRouter = Router()

habitsRouter.use(requireAuth)

habitsRouter.get('/', asyncHandler(habitController.list))
habitsRouter.get('/:id', asyncHandler(habitController.getById))
habitsRouter.post('/', asyncHandler(habitController.create))
habitsRouter.put('/:id', asyncHandler(habitController.update))
habitsRouter.delete('/:id', asyncHandler(habitController.remove))
habitsRouter.post('/:id/complete', asyncHandler(habitController.complete))
habitsRouter.delete('/:id/complete', asyncHandler(habitController.uncomplete))
