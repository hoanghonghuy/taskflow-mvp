import { Router } from 'express'
import * as authController from '../controllers/authController'
import { requireAuth } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

export const authRouter = Router()

authRouter.post('/register', asyncHandler(authController.register))
authRouter.post('/login', asyncHandler(authController.login))
authRouter.post('/refresh', asyncHandler(authController.refresh))
authRouter.get('/me', requireAuth, asyncHandler(authController.me))
authRouter.patch('/me', requireAuth, asyncHandler(authController.updateMe))
authRouter.post('/logout', requireAuth, asyncHandler(authController.logout))
authRouter.get('/collaborators', requireAuth, asyncHandler(authController.collaborators))
