import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { asyncHandler } from '../../middleware/errorHandler'
import * as countdownService from './countdown.service'

export const countdownRouter = Router()

countdownRouter.use(requireAuth)

countdownRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const events = await countdownService.listCountdowns(req.userId!)
    res.status(200).json(events)
  }),
)

countdownRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await countdownService.getCountdown(req.userId!, req.params.id)
    if (!event) {
      res.status(404).json({ error: 'not_found', message: 'Countdown not found' })
      return
    }
    res.status(200).json(event)
  }),
)

countdownRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const event = await countdownService.createCountdown(req.userId!, req.body)
    res.status(201).location(`/api/countdown/${event.id}`).json(event)
  }),
)

countdownRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await countdownService.updateCountdown(req.userId!, req.params.id, req.body)
    if (!event) {
      res.status(404).json({ error: 'not_found', message: 'Countdown not found' })
      return
    }
    res.status(200).json(event)
  }),
)

countdownRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await countdownService.deleteCountdown(req.userId!, req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'not_found', message: 'Countdown not found' })
      return
    }
    res.status(204).send()
  }),
)
