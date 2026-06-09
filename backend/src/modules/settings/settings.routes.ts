import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { asyncHandler } from '../../middleware/errorHandler'
import * as settingsService from './settings.service'

export const settingsRouter = Router()

settingsRouter.use(requireAuth)

settingsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const settings = await settingsService.getOrCreateSettings(req.userId!)
    res.status(200).json(settings)
  }),
)

settingsRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const settings = await settingsService.updateSettings(req.userId!, req.body)
    res.status(200).json(settings)
  }),
)
