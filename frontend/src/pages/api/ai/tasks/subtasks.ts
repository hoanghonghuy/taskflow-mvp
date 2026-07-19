import type { NextApiRequest, NextApiResponse } from 'next'
import { backendFetchAuthed } from '@/lib/server/backend-authed-fetch'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }

  try {
    const init: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body ?? {}),
    }

    const response = await backendFetchAuthed(req, res, '/api/ai/tasks/subtasks', init)

    if (response.status === 204) {
      return res.status(204).end()
    }

    const data = await response.json().catch(() => null)
    return res.status(response.status).json(data ?? {})
  } catch (error) {
    console.error('API Error (proxy to backend /api/ai/tasks/subtasks):', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
