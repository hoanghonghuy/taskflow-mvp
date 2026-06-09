import type { Request, Response, NextFunction } from 'express'
import { AppError } from './errorHandler'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 30

const buckets = new Map<string, { count: number; resetAt: number }>()

/** Clear in-memory buckets (for tests). */
export function resetAiRateLimitBuckets(): void {
  buckets.clear()
}

export function aiRateLimit(req: Request, _res: Response, next: NextFunction): void {
  const userId = req.userId
  if (!userId) {
    next()
    return
  }

  const now = Date.now()
  const bucket = buckets.get(userId)

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS })
    next()
    return
  }

  if (bucket.count >= MAX_REQUESTS) {
    next(new AppError(429, 'too_many_requests', 'AI rate limit exceeded. Try again later.'))
    return
  }

  bucket.count += 1
  next()
}
