import { Router } from 'express'
import * as countdownController from '../controllers/countdownController'
import { requireAuth } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

export const countdownRouter = Router()

countdownRouter.use(requireAuth)

countdownRouter.get('/', asyncHandler(countdownController.list))
countdownRouter.get('/:id', asyncHandler(countdownController.getById))
countdownRouter.post('/', asyncHandler(countdownController.create))
countdownRouter.put('/:id', asyncHandler(countdownController.update))
countdownRouter.delete('/:id', asyncHandler(countdownController.remove))
