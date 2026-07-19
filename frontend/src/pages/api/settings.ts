import type { NextApiRequest, NextApiResponse } from 'next'
import { backendFetchAuthed } from '@/lib/server/backend-authed-fetch'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const response = await backendFetchAuthed(req, res, '/api/settings')

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        return res.status(response.status).json(payload ?? { error: 'Failed to fetch settings' })
      }

      const data = await response.json()
      return res.status(200).json(data)
    }

    if (req.method === 'PUT') {
      const body = JSON.stringify(req.body ?? {})

      const response = await backendFetchAuthed(req, res, '/api/settings', {
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
