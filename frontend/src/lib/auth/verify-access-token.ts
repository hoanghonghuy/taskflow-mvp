import { jwtVerify } from 'jose'
import {
  getJwtVerificationConfig,
  NAME_IDENTIFIER_CLAIM,
  ROLE_CLAIM,
  type VerifiedAccessToken,
} from './jwt-claims'

export async function verifyAccessToken(token: string): Promise<VerifiedAccessToken | null> {
  const trimmed = token.trim()
  if (!trimmed) return null

  const { key, issuer, audience } = getJwtVerificationConfig()

  try {
    const secret = new TextEncoder().encode(key)
    const { payload } = await jwtVerify(trimmed, secret, {
      algorithms: ['HS256'],
      issuer,
      audience,
    })

    const userId =
      (payload[NAME_IDENTIFIER_CLAIM] as string | undefined) ??
      (payload.sub as string | undefined)

    if (!userId) return null

    const roleRaw =
      (payload[ROLE_CLAIM] as string | undefined) ??
      (payload.role as string | undefined) ??
      'USER'

    return {
      userId,
      role: roleRaw === 'ADMIN' ? 'ADMIN' : 'USER',
    }
  } catch {
    return null
  }
}
