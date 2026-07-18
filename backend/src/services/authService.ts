import { randomBytes } from 'crypto'
import { config } from '../config'
import { hashPassword, verifyPassword } from '../lib/password'
import { signToken } from '../lib/jwt'
import { parseJsonArray } from '../lib/json'
import { seedDefaultListsForUser } from '../seed'
import { AppError } from '../middleware/errorHandler'
import * as authRepository from '../repositories/authRepository'
import * as listRepository from '../repositories/listRepository'
import type { AuthResponse, UserDto } from '../types/auth.types'

export type { AuthResponse, UserDto } from '../types/auth.types'

function mapUser(user: { id: string; name: string; email: string; role: string }): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
  }
}

function createRefreshTokenValue(): string {
  return randomBytes(32).toString('base64')
}

async function issueTokens(user: {
  id: string
  name: string
  email: string
  role: string
}): Promise<AuthResponse> {
  const role = user.role === 'ADMIN' ? 'ADMIN' : 'USER'
  const token = signToken({ userId: user.id, email: user.email, name: user.name, role })
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

export async function getMe(userId: string): Promise<UserDto | null> {
  const user = await authRepository.findUserById(userId)
  return user ? mapUser(user) : null
}

export async function updateMe(
  userId: string,
  body: Record<string, unknown>,
): Promise<UserDto | null> {
  const user = await authRepository.findUserById(userId)
  if (!user) return null

  if ('name' in body && body.name != null) {
    const name = String(body.name).trim()
    if (!name) throw new AppError(400, 'invalid_request', 'Name must not be empty')
    const updated = await authRepository.updateUserName(userId, name)
    return mapUser(updated)
  }

  return mapUser(user)
}

export async function logout(userId: string): Promise<void> {
  await authRepository.revokeAllRefreshTokensForUser(userId)
}

export async function lookupUserByEmail(requesterId: string, email: string): Promise<UserDto> {
  const normalized = email.trim().toLowerCase()
  const found = await authRepository.findUserByEmail(normalized)
  if (!found) {
    throw new AppError(404, 'not_found', 'User not found')
  }
  if (found.id === requesterId) {
    throw new AppError(400, 'invalid_request', 'Cannot invite yourself')
  }
  return mapUser(found)
}

export async function getCollaborators(userId: string): Promise<UserDto[]> {
  const lists = await listRepository.findListsAccessibleByUserId(userId)
  const memberIds = new Set<string>()

  for (const list of lists) {
    if (list.userId !== userId) {
      memberIds.add(list.userId)
    }
    for (const memberId of parseJsonArray<string>(list.members)) {
      if (memberId && memberId !== userId) {
        memberIds.add(memberId)
      }
    }
  }

  const users = await authRepository.findUsersByIds([...memberIds])
  return users.map(mapUser)
}

export async function refresh(refreshTokenValue: string): Promise<AuthResponse> {
  if (!refreshTokenValue?.trim()) {
    throw new AppError(400, 'invalid_request', 'Refresh token is required')
  }

  const existing = await authRepository.consumeRefreshToken(refreshTokenValue.trim())

  if (!existing) {
    throw new AppError(401, 'unauthorized', 'Invalid or expired refresh token')
  }

  return issueTokens(existing.user)
}
