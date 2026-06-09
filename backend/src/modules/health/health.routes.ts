import { Router } from 'express'
import { prisma } from '../../lib/prisma'
import { asyncHandler } from '../../middleware/errorHandler'

export const healthRouter = Router()

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      res.status(200).json({ status: 'healthy', database: 'ok' })
    } catch {
      res.status(503).json({ status: 'unhealthy', database: 'error' })
    }
  }),
)
