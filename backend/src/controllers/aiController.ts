import type { Request, Response } from 'express'
import { AppError } from '../middleware/errorHandler'
import { sendSuccess } from '../lib/response'
import * as aiService from '../services/aiService'
import { analyzeTaskSchema, briefingSchema, chatSchema, generateSubtasksSchema } from '../validators/ai.validator'

export async function status(req: Request, res: Response): Promise<void> {
  const available = await aiService.isAiAvailable(req.userId!)
  sendSuccess(res, { available, provider: aiService.getAiProvider() })
}

export async function briefing(req: Request, res: Response): Promise<void> {
  const body = briefingSchema.parse(req.body ?? {})
  const result = await aiService.briefing(req.userId!, body.language)
  sendSuccess(res, result)
}

export async function analyzeTask(req: Request, res: Response): Promise<void> {
  const body = analyzeTaskSchema.parse(req.body)
  if (!body.text.trim()) {
    throw new AppError(400, 'invalid_request', 'Text is required')
  }
  const result = await aiService.analyzeTask(req.userId!, body.text, body.language)
  sendSuccess(res, result)
}

export async function generateSubtasks(req: Request, res: Response): Promise<void> {
  const body = generateSubtasksSchema.parse(req.body ?? {})
  const result = await aiService.generateSubtasks(
    req.userId!,
    body.title,
    body.description,
    body.language,
  )
  sendSuccess(res, result)
}

export async function chat(req: Request, res: Response): Promise<void> {
  const body = chatSchema.parse(req.body)
  const result = await aiService.chat(
    req.userId!,
    body.messages,
    body.language,
    body.thinkingMode,
    body.searchGrounding,
  )
  sendSuccess(res, result)
}

