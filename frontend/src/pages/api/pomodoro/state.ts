import type { NextApiRequest, NextApiResponse } from 'next'
import { backendFetchWithToken } from '@/lib/server/backend-client'

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
  const { method } = req

  const token = getAuthTokenFromRequest(req)

  try {
    switch (method) {
      case 'GET': {
        if (!token) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        const response = await backendFetchWithToken('/api/pomodoro/state', token)

        if (response.status === 204) {
          return res.status(204).end()
        }

        const data = await response.json().catch(() => null)
        if (data === null || data === undefined) {
          return res.status(response.status).end()
        }

        return res.status(response.status).json(data)
      }

      case 'PUT': {
        if (!token) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        const response = await backendFetchWithToken('/api/pomodoro/state', token, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        })

        const data = await response.json().catch(() => null)
        if (data === null || data === undefined) {
          return res.status(response.status).end()
        }

        return res.status(response.status).json(data)
      }

      default:
        res.setHeader('Allow', ['GET', 'PUT'])
        return res.status(405).json({ error: `Method ${method} Not Allowed` })
    }
  } catch (error) {
    console.error('API Error (proxy to backend /api/pomodoro/state):', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
