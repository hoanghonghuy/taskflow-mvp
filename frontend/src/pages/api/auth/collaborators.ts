import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthTokenFromRequest } from '@/lib/server/auth-token'
import { unwrapBackendPayload } from '@/lib/server/backend-response'
import { backendFetchWithToken } from '@/lib/server/backend-client'
import { isMockMode } from '@/lib/server/mock-backend'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  if (isMockMode()) {
    return res.status(200).json({ success: true, data: [] })
  }

  const token = getAuthTokenFromRequest(req)
  if (!token) {
    return res.status(401).json({ success: false, error: 'unauthorized' })
  }

  try {
    const response = await backendFetchWithToken('/api/auth/collaborators', token, { method: 'GET' })
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      return res.status(response.status).json(body ?? { success: false })
    }
    const data = unwrapBackendPayload(body)
    return res.status(200).json({ success: true, data: Array.isArray(data) ? data : [] })
  } catch (error) {
    console.error('API Error (auth/collaborators):', error)
    return res.status(500).json({ success: false, error: 'internal_server_error' })
  }
}
