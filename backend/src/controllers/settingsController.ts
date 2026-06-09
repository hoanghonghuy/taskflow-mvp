import type { Request, Response } from 'express'
import { sendSuccess } from '../lib/response'
import * as settingsService from '../services/settingsService'

export async function get(req: Request, res: Response): Promise<void> {
  const settings = await settingsService.getOrCreateSettings(req.userId!)
  sendSuccess(res, settings)
}

export async function update(req: Request, res: Response): Promise<void> {
  const settings = await settingsService.updateSettings(req.userId!, req.body ?? {})
  sendSuccess(res, settings)
}
