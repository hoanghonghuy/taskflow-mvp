import type { NextFunction, Request, Response } from 'express'
import { ZodError, z } from 'zod'
import { requireAdmin, requireAuth } from '../../src/middleware/auth'
import { AppError, asyncHandler, errorHandler } from '../../src/middleware/errorHandler'
import { signToken } from '../../src/lib/jwt'
import * as authRepository from '../../src/repositories/authRepository'

jest.mock('../../src/repositories/authRepository')

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
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 without bearer token', async () => {
    const req = { headers: {} } as Request
    const res = mockRes()
    const next = jest.fn()
    await requireAuth(req, res, next)
    expect(res.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('attaches userId for valid token when user exists', async () => {
    jest.mocked(authRepository.findUserById).mockResolvedValue({
      id: 'u1',
      name: 'A',
      email: 'a@t.com',
      passwordHash: 'h',
      role: 'USER',
      createdAt: new Date(),
    })
    const token = signToken({ userId: 'u1', email: 'a@t.com', name: 'A', role: 'USER' })
    const req = { headers: { authorization: `Bearer ${token}` } } as Request
    const res = mockRes()
    const next = jest.fn()
    await requireAuth(req, res, next)
    expect(req.userId).toBe('u1')
    expect(req.userRole).toBe('USER')
    expect(next).toHaveBeenCalled()
  })

  it('returns 401 when token is valid but user no longer exists', async () => {
    jest.mocked(authRepository.findUserById).mockResolvedValue(null)
    const token = signToken({ userId: 'ghost', email: 'g@t.com', name: 'G', role: 'USER' })
    const req = { headers: { authorization: `Bearer ${token}` } } as Request
    const res = mockRes()
    const next = jest.fn()
    await requireAuth(req, res, next)
    expect(res.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })
})

describe('middleware/requireAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 without userId', async () => {
    const req = {} as Request
    const res = mockRes()
    const next = jest.fn()
    await requireAdmin(req, res, next)
    expect(res.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 403 for non-admin role', async () => {
    jest.mocked(authRepository.findUserById).mockResolvedValue({
      id: 'u1',
      name: 'User',
      email: 'u@test.com',
      passwordHash: 'h',
      role: 'USER',
      createdAt: new Date(),
    })
    const req = { userId: 'u1' } as Request
    const res = mockRes()
    const next = jest.fn()
    await requireAdmin(req, res, next)
    expect(res.statusCode).toBe(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('allows admin role from database', async () => {
    jest.mocked(authRepository.findUserById).mockResolvedValue({
      id: 'a1',
      name: 'Admin',
      email: 'a@test.com',
      passwordHash: 'h',
      role: 'ADMIN',
      createdAt: new Date(),
    })
    const req = { userId: 'a1' } as Request
    const res = mockRes()
    const next = jest.fn()
    await requireAdmin(req, res, next)
    expect(req.userRole).toBe('ADMIN')
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
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    errorHandler(new Error('boom'), {} as Request, res, jest.fn())
    expect(res.statusCode).toBe(500)
    expect(consoleErrorSpy).toHaveBeenCalledWith('[error]', expect.any(Error))
    consoleErrorSpy.mockRestore()
  })

  it('handles production AppError with status 500', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    const res = mockRes()
    errorHandler(new AppError(500, 'server_error', 'Internal error'), {} as Request, res, jest.fn())
    expect(res.statusCode).toBe(500)
    expect(res.body).toMatchObject({ success: false, error: 'server_error' })
    process.env.NODE_ENV = originalEnv
  })

  it('handles non-Error throw', () => {
    const res = mockRes()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    errorHandler('string error' as unknown as Error, {} as Request, res, jest.fn())
    expect(res.statusCode).toBe(500)
    consoleErrorSpy.mockRestore()
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
