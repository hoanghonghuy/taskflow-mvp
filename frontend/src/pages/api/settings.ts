import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthTokenFromRequest } from '@/lib/server/auth-token';
import { backendFetch, backendFetchWithToken } from '@/lib/server/backend-client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = getAuthTokenFromRequest(req)

  try {
    if (req.method === 'GET') {
      const response = token
        ? await backendFetchWithToken('/api/settings', token)
        : await backendFetch('/api/settings')

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        return res.status(response.status).json(payload ?? { error: 'Failed to fetch settings' })
      }

      const data = await response.json()
      return res.status(200).json(data)
    }

    if (req.method === 'PUT') {
      const body = JSON.stringify(req.body ?? {})

      const response = token
        ? await backendFetchWithToken('/api/settings', token, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body,
          })
        : await backendFetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body,
          })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        return res.status(response.status).json(payload ?? { error: 'Failed to update settings' })
      }

      const data = await response.json()
      return res.status(200).json(data)
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  } catch (error) {
    console.error('API Error (proxy to backend /api/settings):', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
