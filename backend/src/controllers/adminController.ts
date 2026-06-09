import type { Request, Response } from 'express'
import { sendError, sendSuccess } from '../lib/response'
import { AppError } from '../middleware/errorHandler'
import * as adminService from '../services/adminService'
import { listUsersQuerySchema, updateUserBodySchema } from '../validators/admin.validator'

export async function getStats(_req: Request, res: Response): Promise<void> {
  const stats = await adminService.getStats()
  sendSuccess(res, stats)
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const query = listUsersQuerySchema.parse(req.query)
  const result = await adminService.listUsers(query)
  sendSuccess(res, result)
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const user = await adminService.getUserDetail(req.params.id)
  sendSuccess(res, user)
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const body = updateUserBodySchema.parse(req.body ?? {})
    const user = await adminService.updateUser(req.params.id, body)
    sendSuccess(res, user)
  } catch (err) {
    if (err instanceof AppError && (err.statusCode === 400 || err.statusCode === 409)) {
      sendError(res, err.statusCode, err.error, err.message)
      return
    }
    throw err
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    await adminService.deleteUser(req.userId!, req.params.id)
    sendSuccess(res, { deleted: true })
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 400) {
      sendError(res, err.statusCode, err.error, err.message)
      return
    }
    throw err
  }
}
