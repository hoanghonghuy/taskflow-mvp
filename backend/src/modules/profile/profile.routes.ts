import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { asyncHandler } from '../../middleware/errorHandler'
import * as profileService from './profile.service'

export const profileRouter = Router()

profileRouter.use(requireAuth)

profileRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const summary = await profileService.getProfileSummary(req.userId!)
    res.status(200).json(summary)
  }),
)

profileRouter.get(
  '/achievements',
  asyncHandler(async (req, res) => {
    const achievements = await profileService.getAchievements(req.userId!)
    res.status(200).json(achievements)
  }),
)
