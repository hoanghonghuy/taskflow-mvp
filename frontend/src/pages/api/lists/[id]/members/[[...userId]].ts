import { NextApiRequest, NextApiResponse } from 'next'
import { getAuthTokenFromRequest } from '@/lib/server/auth-token'
import { backendFetch, backendFetchWithToken } from '@/lib/server/backend-client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const { id } = req.query

  const idValue = Array.isArray(id) ? id[0] : id
  const memberCatchAll = req.query.userId
  const memberUserId = Array.isArray(memberCatchAll)
    ? memberCatchAll[0]
    : typeof memberCatchAll === 'string'
      ? memberCatchAll
      : undefined
  const token = getAuthTokenFromRequest(req)

  if (!idValue || typeof idValue !== 'string') {
    return res.status(400).json({ error: 'List ID is required' })
  }

  try {
    if (method === 'POST') {
      const targetPath = `/api/lists/${encodeURIComponent(idValue)}/members`
      const response = token
        ? await backendFetchWithToken(targetPath, token, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
          })
        : await backendFetch(targetPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
          })
      const data = await response.json().catch(() => null)
      return res.status(response.status).json(data)
    }

    if (method === 'DELETE') {
      if (!memberUserId || typeof memberUserId !== 'string') {
        return res.status(400).json({ error: 'Member user ID is required' })
      }
      const targetPath = `/api/lists/${encodeURIComponent(idValue)}/members/${encodeURIComponent(memberUserId)}`
      const response = token
        ? await backendFetchWithToken(targetPath, token, { method: 'DELETE' })
        : await backendFetch(targetPath, { method: 'DELETE' })
      const data = await response.json().catch(() => null)
      return res.status(response.status).json(data)
    }

    res.setHeader('Allow', ['POST', 'DELETE'])
    return res.status(405).json({ error: `Method ${method} Not Allowed` })
  } catch (error) {
    console.error('API Error (proxy to backend /api/lists/:id/members):', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
