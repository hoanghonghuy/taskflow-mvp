import type { Request, Response } from 'express'
import { sendCreated, sendError, sendNoContent, sendSuccess } from '../lib/response'
import * as countdownService from '../services/countdownService'
import { createCountdownSchema, updateCountdownSchema } from '../validators/countdown.validator'

export async function list(req: Request, res: Response): Promise<void> {
  const events = await countdownService.listCountdowns(req.userId!)
  sendSuccess(res, events)
}

export async function getById(req: Request, res: Response): Promise<void> {
  const event = await countdownService.getCountdown(req.userId!, req.params.id)
  if (!event) {
    sendError(res, 404, 'not_found', 'Countdown not found')
    return
  }
  sendSuccess(res, event)
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = createCountdownSchema.parse(req.body ?? {})
  const event = await countdownService.createCountdown(req.userId!, body)
  sendCreated(res, event, `/api/countdown/${event.id}`)
}

export async function update(req: Request, res: Response): Promise<void> {
  const body = updateCountdownSchema.parse(req.body ?? {})
  const event = await countdownService.updateCountdown(req.userId!, req.params.id, body)
  if (!event) {
    sendError(res, 404, 'not_found', 'Countdown not found')
    return
  }
  sendSuccess(res, event)
}

export async function remove(req: Request, res: Response): Promise<void> {
  const deleted = await countdownService.deleteCountdown(req.userId!, req.params.id)
  if (!deleted) {
    sendError(res, 404, 'not_found', 'Countdown not found')
    return
  }
  sendNoContent(res)
}
