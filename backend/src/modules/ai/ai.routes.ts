import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middleware/auth'
import { AppError, asyncHandler } from '../../middleware/errorHandler'
import * as aiService from './ai.service'

const briefingSchema = z.object({
  language: z.string().optional(),
})

const analyzeSchema = z.object({
  text: z.string(),
  language: z.string().optional(),
})

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      text: z.string(),
    }),
  ),
  language: z.string().optional(),
  thinkingMode: z.boolean().optional(),
  searchGrounding: z.boolean().optional(),
})

export const aiRouter = Router()

aiRouter.use(requireAuth)

aiRouter.post(
  '/briefing',
  asyncHandler(async (req, res) => {
    const body = briefingSchema.parse(req.body ?? {})
    const result = await aiService.briefing(req.userId!, body.language)
    res.status(200).json(result)
  }),
)

aiRouter.post(
  '/tasks/analyze',
  asyncHandler(async (req, res) => {
    const body = analyzeSchema.parse(req.body)
    if (!body.text.trim()) {
      throw new AppError(400, 'invalid_request', 'Text is required')
    }
    const result = await aiService.analyzeTask(req.userId!, body.text, body.language)
    res.status(200).json(result)
  }),
)

aiRouter.post(
  '/chat',
  asyncHandler(async (req, res) => {
    const body = chatSchema.parse(req.body)
    const result = await aiService.chat(
      req.userId!,
      body.messages,
      body.language,
      body.thinkingMode,
      body.searchGrounding,
    )
    res.status(200).json(result)
  }),
)
