export const NAME_IDENTIFIER_CLAIM =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
export const ROLE_CLAIM = 'role'

export type AccessTokenRole = 'ADMIN' | 'USER'

export interface VerifiedAccessToken {
  userId: string
  role: AccessTokenRole
}

export function getJwtVerificationConfig() {
  return {
    key: process.env.JWT_KEY || 'dev-jwt-key-change-me-in-production-32b',
    issuer: process.env.JWT_ISSUER || 'Taskflow',
    audience: process.env.JWT_AUDIENCE || 'TaskflowClient',
  }
}
