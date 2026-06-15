import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { config } from '../config'
import { sendError } from '../lib/response'
import { ConcurrentUpdateError } from '../repositories/settingsRepository'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void fn(req, res, next).catch(next)
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendError(
      res,
      err.statusCode,
      err.error,
      config.isProduction && err.statusCode >= 500
        ? 'An unexpected error occurred'
        : err.message,
    )
    return
  }

  if (err instanceof ZodError) {
    const issues = err.errors.map((e) => ({
      path: e.path.map(String),
      message: e.message,
      code: e.code,
    }))
    const message = issues.map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message)).join('; ')
    sendError(res, 400, 'invalid_request', message, { issues })
    return
  }

  if (err instanceof ConcurrentUpdateError) {
    sendError(res, 409, 'concurrent_update', err.message)
    return
  }

  console.error('[error]', err)

  sendError(
    res,
    500,
    'internal_server_error',
    config.isProduction
      ? 'An unexpected error occurred'
      : err instanceof Error
        ? err.message
        : 'Unknown error',
  )
}
