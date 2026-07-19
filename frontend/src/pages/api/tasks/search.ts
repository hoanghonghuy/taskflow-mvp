import type { NextApiRequest, NextApiResponse } from 'next'
import { backendFetchAuthed } from '@/lib/server/backend-authed-fetch'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  const q = typeof req.query.q === 'string' ? req.query.q : ''
  const limit = typeof req.query.limit === 'string' ? req.query.limit : undefined
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (limit) params.set('limit', limit)
  const query = params.toString()
  const targetPath = `/api/tasks/search${query ? `?${query}` : ''}`

  try {
    const response = await backendFetchAuthed(req, res, targetPath)

    const data = await response.json().catch(() => null)
    if (data === null || data === undefined) {
      return res.status(response.status).end()
    }

    return res.status(response.status).json(data)
  } catch (error) {
    console.error('API Error (proxy to backend /api/tasks/search):', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
