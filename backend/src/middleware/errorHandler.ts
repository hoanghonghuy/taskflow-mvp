import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { config } from '../config'

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
    res.status(err.statusCode).json({
      error: err.error,
      message: config.isProduction && err.statusCode >= 500
        ? 'An unexpected error occurred'
        : err.message,
    })
    return
  }

  if (err instanceof ZodError) {
    const message = err.errors.map((e) => e.message).join('; ')
    res.status(400).json({ error: 'invalid_request', message })
    return
  }

  console.error('[error]', err)

  res.status(500).json({
    error: 'internal_server_error',
    message: config.isProduction
      ? 'An unexpected error occurred'
      : err instanceof Error
        ? err.message
        : 'Unknown error',
  })
}
