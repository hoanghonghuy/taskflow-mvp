export const NAME_IDENTIFIER_CLAIM =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
export const ROLE_CLAIM = 'role'

export type AccessTokenRole = 'ADMIN' | 'USER'

export interface VerifiedAccessToken {
  userId: string
  role: AccessTokenRole
}

const DEV_JWT_KEY = 'dev-jwt-key-change-me-in-production-32b'

export function getJwtVerificationConfig() {
  const jwtKey = process.env.JWT_KEY?.trim()
  if (!jwtKey && process.env.NODE_ENV === 'production') {
    throw new Error('[config] Required JWT_KEY is missing')
  }

  return {
    key: jwtKey || DEV_JWT_KEY,
    issuer: process.env.JWT_ISSUER || 'Taskflow',
    audience: process.env.JWT_AUDIENCE || 'TaskflowClient',
  }
}
