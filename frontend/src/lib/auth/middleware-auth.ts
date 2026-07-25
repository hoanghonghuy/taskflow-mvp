import type { NextRequest } from 'next/server'
import { verifyAccessToken } from './verify-access-token'
import type { AccessTokenRole } from './jwt-claims'

const TOKEN_COOKIE = 'taskflow_token'
const REFRESH_COOKIE = 'taskflow_refresh'

export interface MiddlewareAuthState {
  authenticated: boolean
  role?: AccessTokenRole
}

/**
 * Admin gate for edge middleware.
 * Refresh-only sessions have no role yet — allow through so the client can renew
 * the access JWT; AdminLayout still enforces isAdmin after authReady.
 */
export function allowsAdminRoute(auth: MiddlewareAuthState): boolean {
  if (!auth.authenticated) return false
  if (auth.role === undefined) return true
  return auth.role === 'ADMIN'
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

  // Refresh token là opaque string — không verify trên edge; session API sẽ renew JWT
  // hoặc clear cookie khi refresh thất bại (tránh vòng login↔dashboard).
  if (refreshToken) {
    return { authenticated: true }
  }

  return { authenticated: false }
}
