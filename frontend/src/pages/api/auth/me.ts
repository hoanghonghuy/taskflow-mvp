import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthTokenFromRequest, getRefreshTokenFromRequest } from '@/lib/server/auth-token'
import { unwrapBackendPayload } from '@/lib/server/backend-response'
import { backendFetchAuthed } from '@/lib/server/backend-authed-fetch'
import { buildMockAuthUser, isMockMode } from '@/lib/server/mock-backend'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    if (isMockMode()) {
      const accessToken = getAuthTokenFromRequest(req)
      const refreshToken = getRefreshTokenFromRequest(req)
      if (!accessToken && !refreshToken) {
        return res.status(401).json({ success: false, error: 'unauthorized' })
      }
      return res.status(200).json({ success: true, data: buildMockAuthUser({}) })
    }

    const accessToken = getAuthTokenFromRequest(req)
    const refreshToken = getRefreshTokenFromRequest(req)
    if (!accessToken && !refreshToken) {
      return res.status(401).json({ success: false, error: 'unauthorized' })
    }

    try {
      const response = await backendFetchAuthed(req, res, '/api/auth/me', { method: 'GET' })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        return res.status(response.status).json(body ?? { success: false })
      }
      const data = unwrapBackendPayload(body)
      return res.status(200).json({ success: true, data })
    } catch (error) {
      console.error('API Error (auth/me GET):', error)
      return res.status(500).json({ success: false, error: 'internal_server_error' })
    }
  }

  if (req.method === 'PATCH') {
    if (isMockMode()) {
      const accessToken = getAuthTokenFromRequest(req)
      const refreshToken = getRefreshTokenFromRequest(req)
      if (!accessToken && !refreshToken) {
        return res.status(401).json({ success: false, error: 'unauthorized' })
      }
      const { name } = req.body ?? {}
      return res.status(200).json({
        success: true,
        data: buildMockAuthUser({ name: typeof name === 'string' ? name : undefined }),
      })
    }

    const accessToken = getAuthTokenFromRequest(req)
    const refreshToken = getRefreshTokenFromRequest(req)
    if (!accessToken && !refreshToken) {
      return res.status(401).json({ success: false, error: 'unauthorized' })
    }

    try {
      const response = await backendFetchAuthed(req, res, '/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(req.body ?? {}),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        return res.status(response.status).json(body ?? { success: false })
      }
      const data = unwrapBackendPayload(body)
      return res.status(200).json({ success: true, data })
    } catch (error) {
      console.error('API Error (auth/me PATCH):', error)
      return res.status(500).json({ success: false, error: 'internal_server_error' })
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH'])
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
}
