import type { Request, Response } from 'express'
import { sendCreated, sendError, sendNoContent, sendSuccess } from '../lib/response'
import * as taskService from '../services/taskService'
import { createTaskSchema, reorderTasksSchema, updateTaskSchema } from '../validators/task.validator'

export async function list(req: Request, res: Response): Promise<void> {
  const tasks = await taskService.listTasks(req.userId!)
  sendSuccess(res, tasks)
}

export async function getById(req: Request, res: Response): Promise<void> {
  const task = await taskService.getTask(req.userId!, req.params.id)
  if (!task) {
    sendError(res, 404, 'not_found', 'Task not found')
    return
  }
  sendSuccess(res, task)
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = createTaskSchema.parse(req.body ?? {})
  const task = await taskService.createTask(req.userId!, body)
  sendCreated(res, task, `/api/tasks/${task.id}`)
}

export async function update(req: Request, res: Response): Promise<void> {
  const body = updateTaskSchema.parse(req.body ?? {})
  const task = await taskService.updateTask(req.userId!, req.params.id, body)
  if (!task) {
    sendError(res, 404, 'not_found', 'Task not found')
    return
  }
  sendSuccess(res, task)
}

export async function reorder(req: Request, res: Response): Promise<void> {
  const body = reorderTasksSchema.parse(req.body ?? {})
  const tasks = await taskService.reorderTasks(req.userId!, body.taskIds)
  sendSuccess(res, tasks)
}

export async function remove(req: Request, res: Response): Promise<void> {
  const deleted = await taskService.deleteTask(req.userId!, req.params.id)
  if (!deleted) {
    sendError(res, 404, 'not_found', 'Task not found')
    return
  }
  sendNoContent(res)
}

