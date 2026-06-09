import type { NextApiRequest, NextApiResponse } from 'next'
import { backendFetch, backendFetchWithToken } from '@/lib/server/backend-client'

function getAuthTokenFromRequest(req: NextApiRequest): string | null {
  const authHeader = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization

  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim()
  }

  const cookieHeader = Array.isArray(req.headers.cookie)
    ? req.headers.cookie[0]
    : req.headers.cookie

  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return null
  }

  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split('=')
    if (name === 'taskflow_token') {
      return decodeURIComponent(rest.join('=') || '')
    }
  }

  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  const token = getAuthTokenFromRequest(req)

  try {
    const response = token
      ? await backendFetchWithToken('/api/profile/summary', token)
      : await backendFetch('/api/profile/summary')

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      return res.status(response.status).json(payload ?? { error: 'Failed to fetch profile summary' })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('API Error (proxy to backend /api/profile/summary):', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
