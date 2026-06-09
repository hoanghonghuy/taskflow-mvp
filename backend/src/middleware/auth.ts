import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../lib/jwt'

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized', message: 'Authentication required' })
    return
  }

  const token = header.slice(7)
  const payload = verifyToken(token)
  if (!payload?.userId) {
    res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' })
    return
  }

  req.userId = payload.userId
  next()
}
