import { Router } from 'express'
import * as adminController from '../controllers/adminController'
import { requireAdmin, requireAuth } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

export const adminRouter = Router()

adminRouter.use(requireAuth, requireAdmin)

adminRouter.get('/stats', asyncHandler(adminController.getStats))
adminRouter.get('/users', asyncHandler(adminController.listUsers))
adminRouter.get('/users/:id', asyncHandler(adminController.getUser))
adminRouter.patch('/users/:id', asyncHandler(adminController.updateUser))
adminRouter.delete('/users/:id', asyncHandler(adminController.deleteUser))
