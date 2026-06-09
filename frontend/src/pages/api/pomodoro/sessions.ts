import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthTokenFromRequest } from '@/lib/server/auth-token';
import { backendFetch, backendFetchWithToken } from '@/lib/server/backend-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  const idValue = Array.isArray(id) ? id[0] : id;

  const token = getAuthTokenFromRequest(req);

  try {
    switch (method) {
      case 'GET': {
        const targetPath = idValue
          ? `/api/pomodoro/sessions/${encodeURIComponent(idValue)}`
          : '/api/pomodoro/sessions'

        const response = token
          ? await backendFetchWithToken(targetPath, token)
          : await backendFetch(targetPath);
        if (response.status === 204) {
          return res.status(204).end()
        }
        const data = await response.json()
        return res.status(response.status).json(data)
      }

      case 'POST': {
        const response = token
          ? await backendFetchWithToken('/api/pomodoro/sessions', token, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(req.body),
            })
          : await backendFetch('/api/pomodoro/sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(req.body),
            });
        const data = await response.json()
        return res.status(response.status).json(data)
      }

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ error: `Method ${method} Not Allowed` })
    }
  } catch (error) {
    console.error('API Error (proxy to backend /api/pomodoro/sessions):', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
