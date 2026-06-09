export interface UserDto {
  id: string
  name: string
  email: string
}

export interface AuthResponse {
  user: UserDto
  token: string
  refreshToken: string
  refreshExpiresAt: string
}
