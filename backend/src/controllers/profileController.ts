import type { Request, Response } from 'express'
import { sendSuccess } from '../lib/response'
import * as profileService from '../services/profileService'

export async function summary(req: Request, res: Response): Promise<void> {
  const data = await profileService.getProfileSummary(req.userId!)
  sendSuccess(res, data)
}

export async function achievements(req: Request, res: Response): Promise<void> {
  const data = await profileService.getAchievements(req.userId!)
  sendSuccess(res, data)
}
