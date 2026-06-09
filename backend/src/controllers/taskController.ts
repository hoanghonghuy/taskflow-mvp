import type { Request, Response } from 'express'
import * as taskService from '../services/taskService'
import { createTaskSchema, updateTaskSchema } from '../validators/task.validator'

export async function list(req: Request, res: Response): Promise<void> {
  const tasks = await taskService.listTasks(req.userId!)
  res.status(200).json(tasks)
}

export async function getById(req: Request, res: Response): Promise<void> {
  const task = await taskService.getTask(req.userId!, req.params.id)
  if (!task) {
    res.status(404).json({ error: 'not_found', message: 'Task not found' })
    return
  }
  res.status(200).json(task)
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = createTaskSchema.parse(req.body ?? {})
  const task = await taskService.createTask(req.userId!, body)
  res.status(201).location(`/api/tasks/${task.id}`).json(task)
}

export async function update(req: Request, res: Response): Promise<void> {
  const body = updateTaskSchema.parse(req.body ?? {})
  const task = await taskService.updateTask(req.userId!, req.params.id, body)
  if (!task) {
    res.status(404).json({ error: 'not_found', message: 'Task not found' })
    return
  }
  res.status(200).json(task)
}

export async function remove(req: Request, res: Response): Promise<void> {
  const deleted = await taskService.deleteTask(req.userId!, req.params.id)
  if (!deleted) {
    res.status(404).json({ error: 'not_found', message: 'Task not found' })
    return
  }
  res.status(204).send()
}
