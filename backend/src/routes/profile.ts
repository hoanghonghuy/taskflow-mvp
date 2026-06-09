import { Router } from 'express'
import * as profileController from '../controllers/profileController'
import { requireAuth } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

export const profileRouter = Router()

profileRouter.use(requireAuth)

profileRouter.get('/summary', asyncHandler(profileController.summary))
profileRouter.get('/achievements', asyncHandler(profileController.achievements))
