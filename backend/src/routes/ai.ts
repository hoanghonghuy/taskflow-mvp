import { Router } from 'express'
import * as aiController from '../controllers/aiController'
import { requireAuth } from '../middleware/auth'
import { aiRateLimit } from '../middleware/ai-rate-limit'
import { asyncHandler } from '../middleware/errorHandler'

export const aiRouter = Router()

aiRouter.use(requireAuth)

aiRouter.get('/status', asyncHandler(aiController.status))

aiRouter.use(aiRateLimit)

aiRouter.post('/briefing', asyncHandler(aiController.briefing))
aiRouter.post('/tasks/analyze', asyncHandler(aiController.analyzeTask))
aiRouter.post('/tasks/subtasks', asyncHandler(aiController.generateSubtasks))
aiRouter.post('/chat', asyncHandler(aiController.chat))
