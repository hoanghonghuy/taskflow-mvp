import type { Request, Response, NextFunction } from 'express'
import { AppError } from './errorHandler'

const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS = 10

const buckets = new Map<string, { count: number; resetAt: number }>()

/** Clear in-memory buckets (for tests). */
export function resetAuthRateLimitBuckets(): void {
  buckets.clear()
}

function clientKey(req: Request): string {
  const email =
    typeof req.body === 'object' && req.body !== null && 'email' in req.body
      ? String((req.body as { email?: unknown }).email ?? '').trim().toLowerCase()
      : ''
  // Prefer IP nếu có proxy trust, fallback raw. Ưu tiên email để chặn
  // cùng account từ nhiều IP.
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  return email ? `${ip}|${email}` : ip
}

export function authRateLimit(req: Request, _res: Response, next: NextFunction): void {
  const key = clientKey(req)
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    next()
    return
  }

  if (bucket.count >= MAX_REQUESTS) {
    next(
      new AppError(
        429,
        'too_many_requests',
        'Too many auth attempts. Please try again later.',
      ),
    )
    return
  }

  bucket.count += 1
  next()
}
