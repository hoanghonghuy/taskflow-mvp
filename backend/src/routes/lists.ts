import { Router } from 'express'
import * as listController from '../controllers/listController'
import { requireAuth } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'

export const listsRouter = Router()

listsRouter.use(requireAuth)

listsRouter.get('/', asyncHandler(listController.list))
listsRouter.get('/:id', asyncHandler(listController.getById))
listsRouter.post('/', asyncHandler(listController.create))
listsRouter.put('/:id', asyncHandler(listController.update))
listsRouter.post('/:id/members', asyncHandler(listController.addMember))
listsRouter.delete('/:id/members/:userId', asyncHandler(listController.removeMember))
listsRouter.delete('/:id', asyncHandler(listController.remove))
