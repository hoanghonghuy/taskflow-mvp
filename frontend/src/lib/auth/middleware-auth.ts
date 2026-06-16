import type { NextRequest } from 'next/server'
import { verifyAccessToken } from './verify-access-token'
import type { AccessTokenRole } from './jwt-claims'

const TOKEN_COOKIE = 'taskflow_token'
const REFRESH_COOKIE = 'taskflow_refresh'

export interface MiddlewareAuthState {
  authenticated: boolean
  role?: AccessTokenRole
}

export async function resolveMiddlewareAuth(request: NextRequest): Promise<MiddlewareAuthState> {
  const accessToken = request.cookies.get(TOKEN_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value?.trim()

  if (accessToken) {
    const verified = await verifyAccessToken(accessToken)
    if (verified) {
      return { authenticated: true, role: verified.role }
    }
  }

  // Refresh token là opaque string — không verify trên edge; session API sẽ renew JWT.
  if (refreshToken) {
    return { authenticated: true }
  }

  return { authenticated: false }
}
