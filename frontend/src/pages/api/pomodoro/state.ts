import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthTokenFromRequest } from '@/lib/server/auth-token';
import { backendFetchWithToken } from '@/lib/server/backend-client'

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
