import { NextApiRequest, NextApiResponse } from 'next';
import { backendFetchAuthed } from '@/lib/server/backend-authed-fetch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  const idValue = Array.isArray(id) ? id[0] : id;

  try {
    switch (method) {
      case 'GET': {
        const targetPath = idValue
          ? `/api/tasks/${encodeURIComponent(idValue)}`
          : '/api/tasks';

        const response = await backendFetchAuthed(req, res, targetPath);

        if (response.status === 204) {
          return res.status(204).end();
        }

        const data = await response.json().catch(() => null);
        if (data === null || data === undefined) {
          return res.status(response.status).end();
        }

        return res.status(response.status).json(data);
      }

      case 'POST': {
        const response = await backendFetchAuthed(req, res, '/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
        });
        const data = await response.json();
        return res.status(response.status).json(data);
      }

      case 'PUT': {
        if (!idValue || typeof idValue !== 'string') {
          return res.status(400).json({ error: 'Task ID is required' });
        }

        const response = await backendFetchAuthed(
          req,
          res,
          `/api/tasks/${encodeURIComponent(idValue)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
          },
        );
        const data = await response.json();
        return res.status(response.status).json(data);
      }

      case 'DELETE': {
        if (!idValue || typeof idValue !== 'string') {
          return res.status(400).json({ error: 'Task ID is required' });
        }

        const response = await backendFetchAuthed(
          req,
          res,
          `/api/tasks/${encodeURIComponent(idValue)}`,
          {
            method: 'DELETE',
          },
        );
        if (response.status === 204) {
          return res.status(204).end();
        }
        const data = await response.json();
        return res.status(response.status).json(data);
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error (proxy to backend /api/tasks):', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
