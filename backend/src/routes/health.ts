import { Router } from 'express'
import * as healthController from '../controllers/healthController'
import { asyncHandler } from '../middleware/errorHandler'

export const healthRouter = Router()

healthRouter.get('/', asyncHandler(healthController.check))
