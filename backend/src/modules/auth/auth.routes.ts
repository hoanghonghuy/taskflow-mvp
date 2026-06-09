import { Router } from 'express'
import { z } from 'zod'
import { AppError, asyncHandler } from '../../middleware/errorHandler'
import * as authService from './auth.service'

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export const authRouter = Router()

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    try {
      const body = registerSchema.parse(req.body)
      const result = await authService.register(body.name, body.email, body.password)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof AppError && (err.statusCode === 400 || err.statusCode === 409)) {
        res.status(err.statusCode).json({ error: err.message })
        return
      }
      throw err
    }
  }),
)

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body)
    const result = await authService.login(body.email, body.password)
    if (!result) {
      res.status(401).json({ error: 'unauthorized', message: 'Invalid credentials' })
      return
    }
    res.status(200).json(result)
  }),
)

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const body = refreshSchema.parse(req.body)
    const result = await authService.refresh(body.refreshToken)
    res.status(200).json(result)
  }),
)
