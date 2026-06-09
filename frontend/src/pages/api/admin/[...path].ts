import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthTokenFromRequest } from '@/lib/server/auth-token'
import { backendFetchWithToken } from '@/lib/server/backend-client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = getAuthTokenFromRequest(req)
  if (!token) {
    return res.status(401).json({ success: false, error: 'unauthorized', message: 'Authentication required' })
  }

  const segments = req.query.path
  const pathParts = Array.isArray(segments) ? segments : segments ? [segments] : []
  const backendPath = `/api/admin/${pathParts.join('/')}`

  try {
    const response = await backendFetchWithToken(backendPath, token, {
      method: req.method,
      headers: req.method !== 'GET' && req.method !== 'DELETE'
        ? { 'Content-Type': 'application/json' }
        : undefined,
      body: req.method !== 'GET' && req.method !== 'DELETE'
        ? JSON.stringify(req.body ?? {})
        : undefined,
    })

    if (response.status === 204) {
      return res.status(204).end()
    }

    const payload = await response.json().catch(() => null)
    return res.status(response.status).json(payload ?? { error: 'Admin proxy failed' })
  } catch (error) {
    console.error(`API Error (proxy to backend ${backendPath}):`, error)
    return res.status(500).json({ success: false, error: 'internal_error', message: 'Internal server error' })
  }
}
