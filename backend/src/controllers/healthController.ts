import type { Request, Response } from 'express'
import { sendError, sendSuccess } from '../lib/response'
import * as healthRepository from '../repositories/healthRepository'

export async function check(_req: Request, res: Response): Promise<void> {
  try {
    await healthRepository.pingDatabase()
    sendSuccess(res, { status: 'healthy', database: 'ok' })
  } catch {
    sendError(res, 503, 'unhealthy', 'Database unavailable')
  }
}
