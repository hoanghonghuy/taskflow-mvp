import jwt from 'jsonwebtoken'
import { config } from '../config'

const NAME_IDENTIFIER_CLAIM =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
const EMAIL_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
const NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'

export interface JwtUserPayload {
  userId: string
  email: string
  name: string
}

export function signToken(payload: JwtUserPayload): string {
  return jwt.sign(
    {
      [NAME_IDENTIFIER_CLAIM]: payload.userId,
      sub: payload.userId,
      [EMAIL_CLAIM]: payload.email,
      [NAME_CLAIM]: payload.name,
      email: payload.email,
      name: payload.name,
    },
    config.jwt.key,
    {
      algorithm: 'HS256',
      expiresIn: `${config.jwt.expiresHours}h`,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    },
  )
}

export function verifyToken(token: string): JwtUserPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.key, {
      algorithms: ['HS256'],
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as jwt.JwtPayload

    const userId =
      (decoded[NAME_IDENTIFIER_CLAIM] as string | undefined) ??
      (decoded.sub as string | undefined)

    if (!userId) {
      return null
    }

    const email =
      (decoded[EMAIL_CLAIM] as string | undefined) ??
      (decoded.email as string | undefined) ??
      ''

    const name =
      (decoded[NAME_CLAIM] as string | undefined) ??
      (decoded.name as string | undefined) ??
      ''

    return { userId, email, name }
  } catch {
    return null
  }
}
