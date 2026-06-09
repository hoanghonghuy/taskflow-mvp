import type { Response } from 'express'

export type ApiSuccessResponse<T> = { success: true; data: T }
export type ApiErrorResponse = { success: false; error: string; message: string }

export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data } satisfies ApiSuccessResponse<T>)
}

export function sendCreated<T>(res: Response, data: T, location?: string): void {
  if (location) {
    res.location(location)
  }
  sendSuccess(res, data, 201)
}

export function sendNoContent(res: Response): void {
  res.status(204).send()
}

export function sendError(res: Response, status: number, error: string, message: string): void {
  res.status(status).json({ success: false, error, message } satisfies ApiErrorResponse)
}
