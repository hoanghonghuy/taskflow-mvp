import type { Request, Response } from 'express'
import * as healthRepository from '../repositories/healthRepository'

export async function check(_req: Request, res: Response): Promise<void> {
  try {
    await healthRepository.pingDatabase()
    res.status(200).json({ status: 'healthy', database: 'ok' })
  } catch {
    res.status(503).json({ status: 'unhealthy', database: 'error' })
  }
}
