import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthTokenFromRequest } from '@/lib/server/auth-token';
import { backendFetch, backendFetchWithToken } from '@/lib/server/backend-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id, date } = req.query;

  const idValue = Array.isArray(id) ? id[0] : id

  const token = getAuthTokenFromRequest(req);

  try {
    switch (method) {
      case 'GET': {
        const targetPath = idValue
          ? `/api/habits/${encodeURIComponent(idValue)}`
          : '/api/habits'

        const response = token
          ? await backendFetchWithToken(targetPath, token)
          : await backendFetch(targetPath);

        if (response.status === 204) {
          return res.status(204).end()
        }

        const data = await response.json().catch(() => null)
        if (data === null || data === undefined) {
          return res.status(response.status).end()
        }

        return res.status(response.status).json(data)
      }

      case 'POST': {
        // If id is provided, treat as "complete habit for date"; otherwise create habit
        if (idValue) {
          const queryDate = Array.isArray(date) ? date[0] : date
          const bodyDate =
            typeof req.body === 'object' &&
            req.body !== null &&
            'date' in req.body &&
            typeof req.body.date === 'string'
              ? req.body.date
              : undefined
          const dateValue = queryDate ?? bodyDate
          const completeBody = dateValue ? { date: dateValue } : {}
          const response = token
            ? await backendFetchWithToken(`/api/habits/${encodeURIComponent(idValue)}/complete`, token, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(completeBody),
              })
            : await backendFetch(`/api/habits/${encodeURIComponent(idValue)}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(completeBody),
              });

          if (response.status === 204) {
            return res.status(204).end()
          }

          const data = await response.json().catch(() => null)
          return res.status(response.status).json(data ?? {})
        }

        const response = token
          ? await backendFetchWithToken('/api/habits', token, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(req.body),
            })
          : await backendFetch('/api/habits', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(req.body),
            });
        const data = await response.json()
        return res.status(response.status).json(data)
      }

      case 'PUT': {
        if (!idValue || typeof idValue !== 'string') {
          return res.status(400).json({ error: 'Habit ID is required' })
        }

        const response = token
          ? await backendFetchWithToken(`/api/habits/${encodeURIComponent(idValue)}`, token, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(req.body),
            })
          : await backendFetch(`/api/habits/${encodeURIComponent(idValue)}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(req.body),
            });
        const data = await response.json()
        return res.status(response.status).json(data)
      }

      case 'DELETE': {
        if (!idValue || typeof idValue !== 'string') {
          return res.status(400).json({ error: 'Habit ID is required' })
        }

        const dateValue = Array.isArray(date) ? date[0] : date

        // If date is provided, treat as "uncomplete habit for date"; otherwise delete habit
        if (dateValue) {
          const response = token
            ? await backendFetchWithToken(
                `/api/habits/${encodeURIComponent(idValue)}/complete?date=${encodeURIComponent(dateValue)}`,
                token,
                { method: 'DELETE' },
              )
            : await backendFetch(
                `/api/habits/${encodeURIComponent(idValue)}/complete?date=${encodeURIComponent(dateValue)}`,
                { method: 'DELETE' },
              )

          if (response.status === 204) {
            return res.status(204).end()
          }

          const data = await response.json().catch(() => null)
          return res.status(response.status).json(data ?? {})
        }

        const response = token
          ? await backendFetchWithToken(`/api/habits/${encodeURIComponent(idValue)}`, token, {
              method: 'DELETE',
            })
          : await backendFetch(`/api/habits/${encodeURIComponent(idValue)}`, {
              method: 'DELETE',
            });
        if (response.status === 204) {
          return res.status(204).end()
        }
        const data = await response.json()
        return res.status(response.status).json(data)
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).json({ error: `Method ${method} Not Allowed` })
    }
  } catch (error) {
    console.error('API Error (proxy to backend /api/habits):', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
