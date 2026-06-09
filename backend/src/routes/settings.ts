import { Router } from 'express'
import * as settingsController from '../controllers/settingsController'
import { requireAuth } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

export const settingsRouter = Router()

settingsRouter.use(requireAuth)

settingsRouter.get('/', asyncHandler(settingsController.get))
settingsRouter.put('/', asyncHandler(settingsController.update))
