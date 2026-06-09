import { Router } from 'express'
import * as taskController from '../controllers/taskController'
import { requireAuth } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

export const tasksRouter = Router()

tasksRouter.use(requireAuth)

tasksRouter.get('/', asyncHandler(taskController.list))
tasksRouter.get('/:id', asyncHandler(taskController.getById))
tasksRouter.post('/', asyncHandler(taskController.create))
tasksRouter.put('/:id', asyncHandler(taskController.update))
tasksRouter.delete('/:id', asyncHandler(taskController.remove))
