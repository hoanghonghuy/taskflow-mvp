import { Router } from 'express'
import * as authController from '../controllers/authController'
import { requireAuth } from '../middleware/auth'
import { authRateLimit } from '../middleware/auth-rate-limit'
import { asyncHandler } from '../middleware/errorHandler'

export const authRouter = Router()

// Rate-limit áp dụng cho login/refresh/register để chặn brute-force và
// credential stuffing. Lookup/collaborators/me cần auth nên user đã hợp lệ.
authRouter.post('/register', authRateLimit, asyncHandler(authController.register))
authRouter.post('/login', authRateLimit, asyncHandler(authController.login))
authRouter.post('/refresh', authRateLimit, asyncHandler(authController.refresh))
authRouter.get('/me', requireAuth, asyncHandler(authController.me))
authRouter.patch('/me', requireAuth, asyncHandler(authController.updateMe))
authRouter.post('/logout', requireAuth, asyncHandler(authController.logout))
authRouter.get('/collaborators', requireAuth, asyncHandler(authController.collaborators))
authRouter.get('/users/lookup', requireAuth, asyncHandler(authController.lookupUser))
