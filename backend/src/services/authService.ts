import { randomBytes } from 'crypto'
import { config } from '../config'
import { hashPassword, verifyPassword } from '../lib/password'
import { signToken } from '../lib/jwt'
import { seedDefaultListsForUser } from '../seed'
import { AppError } from '../middleware/errorHandler'
import * as authRepository from '../repositories/authRepository'
import type { AuthResponse, UserDto } from '../types/auth.types'

export type { AuthResponse, UserDto } from '../types/auth.types'

function mapUser(user: { id: string; name: string; email: string }): UserDto {
  return { id: user.id, name: user.name, email: user.email }
}

function createRefreshTokenValue(): string {
  return randomBytes(32).toString('base64')
}

async function issueTokens(user: { id: string; name: string; email: string }): Promise<AuthResponse> {
  const token = signToken({ userId: user.id, email: user.email, name: user.name })
  const refreshToken = createRefreshTokenValue()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshExpiresDays)

  await authRepository.createRefreshToken({
    token: refreshToken,
    expiresAt,
    user: { connect: { id: user.id } },
  })

  return {
    user: mapUser(user),
    token,
    refreshToken,
    refreshExpiresAt: expiresAt.toISOString(),
  }
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  if (!name?.trim()) throw new AppError(400, 'invalid_request', 'Name is required')
  if (!email?.trim()) throw new AppError(400, 'invalid_request', 'Email is required')
  if (!password?.trim()) throw new AppError(400, 'invalid_request', 'Password is required')

  const normalizedEmail = email.trim().toLowerCase()
  const existing = await authRepository.findUserByEmail(normalizedEmail)
  if (existing) {
    throw new AppError(409, 'conflict', 'Email is already registered.')
  }

  const passwordHash = await hashPassword(password)
  const user = await authRepository.createUser({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
  })

  await seedDefaultListsForUser(user.id)
  return issueTokens(user)
}

export async function login(email: string, password: string): Promise<AuthResponse | null> {
  if (!email?.trim() || !password?.trim()) return null

  const normalizedEmail = email.trim().toLowerCase()
  const user = await authRepository.findUserByEmail(normalizedEmail)
  if (!user) return null

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) return null

  return issueTokens(user)
}

export async function refresh(refreshTokenValue: string): Promise<AuthResponse> {
  if (!refreshTokenValue?.trim()) {
    throw new AppError(400, 'invalid_request', 'Refresh token is required')
  }

  const existing = await authRepository.findRefreshTokenWithUser(refreshTokenValue)

  if (!existing || existing.revoked || existing.expiresAt <= new Date()) {
    throw new AppError(401, 'unauthorized', 'Invalid or expired refresh token')
  }

  await authRepository.revokeRefreshToken(existing.id)

  return issueTokens(existing.user)
}
