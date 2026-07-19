import type { NextApiRequest, NextApiResponse } from 'next'
import { backendFetchAuthed } from '@/lib/server/backend-authed-fetch'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  try {
    const response = await backendFetchAuthed(req, res, '/api/ai/status')

    const data = await response.json().catch(() => ({ available: false }))
    return res.status(response.status).json(data)
  } catch (error) {
    console.error('API Error (proxy to backend /api/ai/status):', error)
    return res.status(500).json({ available: false })
  }
}
