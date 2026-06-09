import type { Request, Response } from 'express'
import * as countdownService from '../services/countdownService'
import { createCountdownSchema, updateCountdownSchema } from '../validators/countdown.validator'

export async function list(req: Request, res: Response): Promise<void> {
  const events = await countdownService.listCountdowns(req.userId!)
  res.status(200).json(events)
}

export async function getById(req: Request, res: Response): Promise<void> {
  const event = await countdownService.getCountdown(req.userId!, req.params.id)
  if (!event) {
    res.status(404).json({ error: 'not_found', message: 'Countdown not found' })
    return
  }
  res.status(200).json(event)
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = createCountdownSchema.parse(req.body ?? {})
  const event = await countdownService.createCountdown(req.userId!, body)
  res.status(201).location(`/api/countdown/${event.id}`).json(event)
}

export async function update(req: Request, res: Response): Promise<void> {
  const body = updateCountdownSchema.parse(req.body ?? {})
  const event = await countdownService.updateCountdown(req.userId!, req.params.id, body)
  if (!event) {
    res.status(404).json({ error: 'not_found', message: 'Countdown not found' })
    return
  }
  res.status(200).json(event)
}

export async function remove(req: Request, res: Response): Promise<void> {
  const deleted = await countdownService.deleteCountdown(req.userId!, req.params.id)
  if (!deleted) {
    res.status(404).json({ error: 'not_found', message: 'Countdown not found' })
    return
  }
  res.status(204).send()
}
