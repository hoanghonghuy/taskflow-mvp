import type { Request, Response } from 'express'
import * as profileService from '../services/profileService'

export async function summary(req: Request, res: Response): Promise<void> {
  const data = await profileService.getProfileSummary(req.userId!)
  res.status(200).json(data)
}

export async function achievements(req: Request, res: Response): Promise<void> {
  const data = await profileService.getAchievements(req.userId!)
  res.status(200).json(data)
}
