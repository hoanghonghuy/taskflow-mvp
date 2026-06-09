import type { Request, Response } from 'express'
import { sendCreated, sendError, sendNoContent, sendSuccess } from '../lib/response'
import * as habitService from '../services/habitService'
import { isoDateSchema } from '../validators/common'
import { completeHabitSchema, createHabitSchema, updateHabitSchema } from '../validators/habit.validator'

export async function list(req: Request, res: Response): Promise<void> {
  const habits = await habitService.listHabits(req.userId!)
  sendSuccess(res, habits)
}

export async function getById(req: Request, res: Response): Promise<void> {
  const habit = await habitService.getHabit(req.userId!, req.params.id)
  if (!habit) {
    sendError(res, 404, 'not_found', 'Habit not found')
    return
  }
  sendSuccess(res, habit)
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = createHabitSchema.parse(req.body ?? {})
  const habit = await habitService.createHabit(req.userId!, body)
  sendCreated(res, habit, `/api/habits/${habit.id}`)
}

export async function update(req: Request, res: Response): Promise<void> {
  const body = updateHabitSchema.parse(req.body ?? {})
  const habit = await habitService.updateHabit(req.userId!, req.params.id, body)
  if (!habit) {
    sendError(res, 404, 'not_found', 'Habit not found')
    return
  }
  sendSuccess(res, habit)
}

export async function remove(req: Request, res: Response): Promise<void> {
  const deleted = await habitService.deleteHabit(req.userId!, req.params.id)
  if (!deleted) {
    sendError(res, 404, 'not_found', 'Habit not found')
    return
  }
  sendNoContent(res)
}

export async function complete(req: Request, res: Response): Promise<void> {
  const { date } = completeHabitSchema.parse(req.body ?? {})
  const ok = await habitService.completeHabit(req.userId!, req.params.id, date)
  if (!ok) {
    sendError(res, 404, 'not_found', 'Habit not found')
    return
  }
  sendNoContent(res)
}

export async function uncomplete(req: Request, res: Response): Promise<void> {
  const dateRaw = typeof req.query.date === 'string' ? req.query.date : undefined
  const date = dateRaw ? isoDateSchema.parse(dateRaw) : undefined
  const ok = await habitService.uncompleteHabit(req.userId!, req.params.id, date)
  if (!ok) {
    sendError(res, 404, 'not_found', 'Habit not found')
    return
  }
  sendNoContent(res)
}
