import { describe, expect, it } from 'vitest'

const REAL_BACKEND = process.env.REAL_BACKEND_TEST === 'true'
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/$/, '')

describe.skipIf(!REAL_BACKEND)('real backend contract (REAL_BACKEND_TEST=true)', () => {
  it('health endpoint responds', async () => {
    const res = await fetch(`${BACKEND_URL}/health`)
    expect(res.ok).toBe(true)
  })

  it('register returns token and protected route works', async () => {
    const email = `contract-${Date.now()}@test.com`
    const password = 'TestPassword123!'

    const registerRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Contract User', email, password }),
    })

    expect(registerRes.ok).toBe(true)
    const body = (await registerRes.json()) as {
      token?: string
      user?: { id: string }
    }
    expect(body.token).toBeTruthy()
    expect(body.user?.id).toBeTruthy()

    const tasksRes = await fetch(`${BACKEND_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${body.token}` },
    })
    expect(tasksRes.ok).toBe(true)
  })
})
