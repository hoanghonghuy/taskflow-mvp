import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthTokenFromRequest } from '@/lib/server/auth-token';
import { backendFetch, backendFetchWithToken } from '@/lib/server/backend-client'

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
