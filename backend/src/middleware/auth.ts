import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../lib/jwt'
import { sendError } from '../lib/response'
import * as authRepository from '../repositories/authRepository'
import { isAdminRole } from '../types/roles'

declare global {
  namespace Express {
    interface Request {
      userId?: string
      userRole?: string
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    sendError(res, 401, 'unauthorized', 'Authentication required')
    return
  }

  const token = header.slice(7)
  const payload = verifyToken(token)
  if (!payload?.userId) {
    sendError(res, 401, 'unauthorized', 'Invalid or expired token')
    return
  }

  // Token có thể còn hợp lệ về chữ ký nhưng user đã bị xóa (vd reset DB).
  // Không kiểm tra sẽ gây lỗi FK khi các repository upsert theo userId.
  try {
    const user = await authRepository.findUserById(payload.userId)
    if (!user) {
      sendError(res, 401, 'unauthorized', 'Invalid or expired token')
      return
    }
  } catch (err) {
    next(err)
    return
  }

  req.userId = payload.userId
  req.userRole = payload.role
  next()
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId
    if (!userId) {
      sendError(res, 401, 'unauthorized', 'Authentication required')
      return
    }

    const user = await authRepository.findUserById(userId)
    if (!user || !isAdminRole(user.role)) {
      sendError(res, 403, 'forbidden', 'Admin access required')
      return
    }

    req.userRole = user.role
    next()
  } catch (err) {
    next(err)
  }
}
