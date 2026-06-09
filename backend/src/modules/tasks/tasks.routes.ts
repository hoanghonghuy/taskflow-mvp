import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { asyncHandler } from '../../middleware/errorHandler'
import * as tasksService from './tasks.service'

export const tasksRouter = Router()

tasksRouter.use(requireAuth)

tasksRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const tasks = await tasksService.listTasks(req.userId!)
    res.status(200).json(tasks)
  }),
)

tasksRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const task = await tasksService.getTask(req.userId!, req.params.id)
    if (!task) {
      res.status(404).json({ error: 'not_found', message: 'Task not found' })
      return
    }
    res.status(200).json(task)
  }),
)

tasksRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const task = await tasksService.createTask(req.userId!, req.body)
    res.status(201).location(`/api/tasks/${task.id}`).json(task)
  }),
)

tasksRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const task = await tasksService.updateTask(req.userId!, req.params.id, req.body)
    if (!task) {
      res.status(404).json({ error: 'not_found', message: 'Task not found' })
      return
    }
    res.status(200).json(task)
  }),
)

tasksRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await tasksService.deleteTask(req.userId!, req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'not_found', message: 'Task not found' })
      return
    }
    res.status(204).send()
  }),
)
