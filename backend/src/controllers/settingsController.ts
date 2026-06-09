import type { Request, Response } from 'express'
import * as settingsService from '../services/settingsService'

export async function get(req: Request, res: Response): Promise<void> {
  const settings = await settingsService.getOrCreateSettings(req.userId!)
  res.status(200).json(settings)
}

export async function update(req: Request, res: Response): Promise<void> {
  const settings = await settingsService.updateSettings(req.userId!, req.body ?? {})
  res.status(200).json(settings)
}
