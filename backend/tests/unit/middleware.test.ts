import type { NextFunction, Request, Response } from 'express'
import { ZodError, z } from 'zod'
import { requireAdmin, requireAuth } from '../../src/middleware/auth'
import { AppError, asyncHandler, errorHandler } from '../../src/middleware/errorHandler'
import { signToken } from '../../src/lib/jwt'

function mockRes(): Response & { statusCode: number; body: unknown } {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(data: unknown) {
      res.body = data
      return res
    },
    send() {
      return res
    },
  }
  return res as Response & { statusCode: number; body: unknown }
}

describe('middleware/auth', () => {
  it('returns 401 without bearer token', () => {
    const req = { headers: {} } as Request
    const res = mockRes()
    const next = jest.fn()
    requireAuth(req, res, next)
    expect(res.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('attaches userId for valid token', () => {
    const token = signToken({ userId: 'u1', email: 'a@t.com', name: 'A', role: 'USER' })
    const req = { headers: { authorization: `Bearer ${token}` } } as Request
    const res = mockRes()
    const next = jest.fn()
    requireAuth(req, res, next)
    expect(req.userId).toBe('u1')
    expect(req.userRole).toBe('USER')
    expect(next).toHaveBeenCalled()
  })
})

describe('middleware/requireAdmin', () => {
  it('returns 403 for non-admin role', () => {
    const req = { userRole: 'USER' } as Request
    const res = mockRes()
    const next = jest.fn()
    requireAdmin(req, res, next)
    expect(res.statusCode).toBe(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('allows admin role', () => {
    const req = { userRole: 'ADMIN' } as Request
    const res = mockRes()
    const next = jest.fn()
    requireAdmin(req, res, next)
    expect(next).toHaveBeenCalled()
  })
})

describe('middleware/errorHandler', () => {
  it('handles AppError', () => {
    const res = mockRes()
    errorHandler(new AppError(400, 'invalid_request', 'Bad'), {} as Request, res, jest.fn())
    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({ success: false, error: 'invalid_request' })
  })

  it('handles ZodError', () => {
    const res = mockRes()
    try {
      z.object({ x: z.string() }).parse({})
    } catch (err) {
      errorHandler(err, {} as Request, res, jest.fn())
    }
    expect(res.statusCode).toBe(400)
  })

  it('handles unknown errors', () => {
    const res = mockRes()
    errorHandler(new Error('boom'), {} as Request, res, jest.fn())
    expect(res.statusCode).toBe(500)
  })

  it('asyncHandler forwards errors', async () => {
    const handler = asyncHandler(async () => {
      throw new AppError(404, 'not_found', 'missing')
    })
    const next = jest.fn()
    await handler({} as Request, mockRes(), next as NextFunction)
    expect(next).toHaveBeenCalled()
  })
})
