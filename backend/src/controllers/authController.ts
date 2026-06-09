import type { Request, Response } from 'express'
import { sendError, sendSuccess } from '../lib/response'
import { AppError } from '../middleware/errorHandler'
import * as authService from '../services/authService'
import { loginSchema, refreshSchema, registerSchema } from '../validators/auth.validator'

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const body = registerSchema.parse(req.body)
    const result = await authService.register(body.name, body.email, body.password)
    sendSuccess(res, result)
  } catch (err) {
    if (err instanceof AppError && (err.statusCode === 400 || err.statusCode === 409)) {
      sendError(res, err.statusCode, err.error, err.message)
      return
    }
    throw err
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body)
  const result = await authService.login(body.email, body.password)
  if (!result) {
    sendError(res, 401, 'unauthorized', 'Invalid credentials')
    return
  }
  sendSuccess(res, result)
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const body = refreshSchema.parse(req.body)
  const result = await authService.refresh(body.refreshToken)
  sendSuccess(res, result)
}
