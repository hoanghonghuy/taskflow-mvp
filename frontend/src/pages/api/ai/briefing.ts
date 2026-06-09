import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthTokenFromRequest } from '@/lib/server/auth-token';
import { backendFetch, backendFetchWithToken } from '@/lib/server/backend-client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }

  const token = getAuthTokenFromRequest(req)

  try {
    const init: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body ?? {}),
    }

    const response = token
      ? await backendFetchWithToken('/api/ai/briefing', token, init)
      : await backendFetch('/api/ai/briefing', init)

    if (response.status === 204) {
      return res.status(204).end()
    }

    const data = await response.json().catch(() => null)
    return res.status(response.status).json(data ?? {})
  } catch (error) {
    console.error('API Error (proxy to backend /api/ai/briefing):', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
