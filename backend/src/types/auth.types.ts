import type { UserRole } from './roles'

export interface UserDto {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthResponse {
  user: UserDto
  token: string
  refreshToken: string
  refreshExpiresAt: string
}
