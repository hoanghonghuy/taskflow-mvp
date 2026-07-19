import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthTokenFromRequest, getRefreshTokenFromRequest } from '@/lib/server/auth-token'
import { backendFetchAuthed } from '@/lib/server/backend-authed-fetch'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const accessToken = getAuthTokenFromRequest(req)
  const refreshToken = getRefreshTokenFromRequest(req)
  if (!accessToken && !refreshToken) {
    return res.status(401).json({ success: false, error: 'unauthorized', message: 'Authentication required' })
  }

  const segments = req.query.path
  const pathParts = Array.isArray(segments) ? segments : segments ? [segments] : []
  const backendPath = `/api/admin/${pathParts.join('/')}`

  try {
    const response = await backendFetchAuthed(req, res, backendPath, {
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
