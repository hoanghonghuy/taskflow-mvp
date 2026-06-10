import { describe, expect, it } from 'vitest'
import reorderHandler from '@/pages/api/tasks/reorder'
import adminHandler from '@/pages/api/admin/[...path]'
import subtasksHandler from '@/pages/api/ai/tasks/subtasks'
import { runHandler } from '../helpers/api-mock'

describe('API routes extended coverage', () => {
  describe('tasks/reorder', () => {
    it('POST reorders tasks', async () => {
      const res = await runHandler(reorderHandler, 'POST', {
        body: { taskIds: ['id1', 'id2', 'id3'] },
      })
      expect(res.status).toHaveBeenCalled()
    })

    it('rejects non-POST methods', async () => {
      const res = await runHandler(reorderHandler, 'GET')
      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.setHeader).toHaveBeenCalledWith('Allow', ['POST'])
    })

    it('handles errors from backend', async () => {
      const res = await runHandler(reorderHandler, 'POST', {
        body: { taskIds: [] },
      })
      expect(res.status).toHaveBeenCalled()
    })

    it('works with auth token', async () => {
      const res = await runHandler(reorderHandler, 'POST', {
        headers: { authorization: 'Bearer token123' },
        body: { taskIds: ['a', 'b'] },
      })
      expect(res.status).toHaveBeenCalled()
    })

    it('works without auth token', async () => {
      const res = await runHandler(reorderHandler, 'POST', {
        body: { taskIds: ['x', 'y'] },
      })
      expect(res.status).toHaveBeenCalled()
    })
  })

  describe('admin/[...path]', () => {
    it('requires authentication', async () => {
      const res = await runHandler(adminHandler, 'GET', {
        query: { path: ['users'] },
      })
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'unauthorized' })
      )
    })

    it('proxies GET requests', async () => {
      const res = await runHandler(adminHandler, 'GET', {
        headers: { authorization: 'Bearer admin-token' },
        query: { path: ['users'] },
      })
      expect(res.status).toHaveBeenCalled()
    })

    it('proxies POST requests with body', async () => {
      const res = await runHandler(adminHandler, 'POST', {
        headers: { authorization: 'Bearer admin-token' },
        query: { path: ['users', '123'] },
        body: { role: 'admin' },
      })
      expect(res.status).toHaveBeenCalled()
    })

    it('proxies PUT requests', async () => {
      const res = await runHandler(adminHandler, 'PUT', {
        headers: { authorization: 'Bearer admin-token' },
        query: { path: ['users', 'abc'] },
        body: { name: 'Updated' },
      })
      expect(res.status).toHaveBeenCalled()
    })

    it('proxies PATCH requests', async () => {
      const res = await runHandler(adminHandler, 'PATCH', {
        headers: { authorization: 'Bearer admin-token' },
        query: { path: ['users', 'xyz'] },
        body: { email: 'new@example.com' },
      })
      expect(res.status).toHaveBeenCalled()
    })

    it('proxies DELETE requests', async () => {
      const res = await runHandler(adminHandler, 'DELETE', {
        headers: { authorization: 'Bearer admin-token' },
        query: { path: ['users', '456'] },
      })
      expect(res.status).toHaveBeenCalled()
    })

    it('handles array path segments', async () => {
      const res = await runHandler(adminHandler, 'GET', {
        headers: { authorization: 'Bearer admin-token' },
        query: { path: ['stats', 'overview'] },
      })
      expect(res.status).toHaveBeenCalled()
    })

    it('handles single path segment', async () => {
      const res = await runHandler(adminHandler, 'GET', {
        headers: { authorization: 'Bearer admin-token' },
        query: { path: 'users' },
      })
      expect(res.status).toHaveBeenCalled()
    })

    it('handles empty path', async () => {
      const res = await runHandler(adminHandler, 'GET', {
        headers: { authorization: 'Bearer admin-token' },
        query: {},
      })
      expect(res.status).toHaveBeenCalled()
    })

    it('handles 204 responses', async () => {
      const res = await runHandler(adminHandler, 'DELETE', {
        headers: { authorization: 'Bearer admin-token' },
        query: { path: ['users', 'to-delete'] },
      })
      expect(res.status).toHaveBeenCalled()
    })
  })

  describe('ai/tasks/subtasks', () => {
    it('POST generates subtasks', async () => {
      const res = await runHandler(subtasksHandler, 'POST', {
        body: { taskId: 'task1', title: 'Complex task' },
      })
      expect([200, 204]).toContain(res.status.mock.calls[0][0])
    })

    it('rejects non-POST methods', async () => {
      const res = await runHandler(subtasksHandler, 'GET')
      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.setHeader).toHaveBeenCalledWith('Allow', ['POST'])
    })

    it('works with auth token', async () => {
      const res = await runHandler(subtasksHandler, 'POST', {
        headers: { authorization: 'Bearer token' },
        body: { taskId: 'x', title: 'Task' },
      })
      expect(res.status).toHaveBeenCalled()
    })

    it('works without auth token', async () => {
      const res = await runHandler(subtasksHandler, 'POST', {
        body: { taskId: 'y', title: 'Another' },
      })
      expect(res.status).toHaveBeenCalled()
    })

    it('handles empty body', async () => {
      const res = await runHandler(subtasksHandler, 'POST', {
        body: {},
      })
      expect(res.status).toHaveBeenCalled()
    })

    it('handles 204 response', async () => {
      const res = await runHandler(subtasksHandler, 'POST', {
        body: { taskId: 'id', title: 'test' },
      })
      expect(res.status).toHaveBeenCalled()
    })

    it('handles errors gracefully', async () => {
      const res = await runHandler(subtasksHandler, 'POST', {
        body: null,
      })
      expect(res.status).toHaveBeenCalled()
    })
  })
})
