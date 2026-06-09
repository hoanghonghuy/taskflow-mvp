import type { Request, Response } from 'express'
import { sendSuccess } from '../lib/response'
import * as adminService from '../services/adminService'
import { listUsersQuerySchema, updateUserRoleBodySchema } from '../validators/admin.validator'

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

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const body = updateUserRoleBodySchema.parse(req.body ?? {})
  const user = await adminService.updateUserRole(req.userId!, req.params.id, body.role)
  sendSuccess(res, user)
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  await adminService.deleteUser(req.userId!, req.params.id)
  sendSuccess(res, { deleted: true })
}
