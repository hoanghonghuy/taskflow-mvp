import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { asyncHandler } from '../../middleware/errorHandler'
import * as habitsService from './habits.service'

export const habitsRouter = Router()

habitsRouter.use(requireAuth)

habitsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const habits = await habitsService.listHabits(req.userId!)
    res.status(200).json(habits)
  }),
)

habitsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const habit = await habitsService.getHabit(req.userId!, req.params.id)
    if (!habit) {
      res.status(404).json({ error: 'not_found', message: 'Habit not found' })
      return
    }
    res.status(200).json(habit)
  }),
)

habitsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const habit = await habitsService.createHabit(req.userId!, req.body)
    res.status(201).location(`/api/habits/${habit.id}`).json(habit)
  }),
)

habitsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const habit = await habitsService.updateHabit(req.userId!, req.params.id, req.body)
    if (!habit) {
      res.status(404).json({ error: 'not_found', message: 'Habit not found' })
      return
    }
    res.status(200).json(habit)
  }),
)

habitsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await habitsService.deleteHabit(req.userId!, req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'not_found', message: 'Habit not found' })
      return
    }
    res.status(204).send()
  }),
)

habitsRouter.post(
  '/:id/complete',
  asyncHandler(async (req, res) => {
    const date = typeof req.body?.date === 'string' ? req.body.date : undefined
    const ok = await habitsService.completeHabit(req.userId!, req.params.id, date)
    if (!ok) {
      res.status(404).json({ error: 'not_found', message: 'Habit not found' })
      return
    }
    res.status(204).send()
  }),
)

habitsRouter.delete(
  '/:id/complete',
  asyncHandler(async (req, res) => {
    const date = typeof req.query.date === 'string' ? req.query.date : undefined
    const ok = await habitsService.uncompleteHabit(req.userId!, req.params.id, date)
    if (!ok) {
      res.status(404).json({ error: 'not_found', message: 'Habit not found' })
      return
    }
    res.status(204).send()
  }),
)
