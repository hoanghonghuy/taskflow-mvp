import { Router } from 'express'
import * as authController from '../controllers/authController'
import { asyncHandler } from '../middleware/errorHandler'

export const authRouter = Router()

authRouter.post('/register', asyncHandler(authController.register))
authRouter.post('/login', asyncHandler(authController.login))
authRouter.post('/refresh', asyncHandler(authController.refresh))
