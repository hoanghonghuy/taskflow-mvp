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

  const email = typeof req.query.email === 'string' ? req.query.email.trim() : ''
  if (!email) {
    return res.status(400).json({ success: false, error: 'invalid_request', message: 'Email is required' })
  }

  if (isMockMode()) {
    return res.status(404).json({ success: false, error: 'not_found', message: 'User not found' })
  }

  const token = getAuthTokenFromRequest(req)
  if (!token) {
    return res.status(401).json({ success: false, error: 'unauthorized' })
  }

  try {
    const response = await backendFetchWithToken(
      `/api/auth/users/lookup?email=${encodeURIComponent(email)}`,
      token,
      { method: 'GET' },
    )
    const body = await response.json().catch(() => null)
    if (!response.ok) {
      return res.status(response.status).json(body ?? { success: false })
    }
    const data = unwrapBackendPayload(body)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('API Error (auth/lookup-user):', error)
    return res.status(500).json({ success: false, error: 'internal_server_error' })
  }
}
