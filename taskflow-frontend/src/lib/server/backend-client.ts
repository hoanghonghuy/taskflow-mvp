const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:5134').replace(/\/$/, '')

let cachedToken: string | null = null
let tokenExpiresAt: number | null = null

async function getDevToken(): Promise<string> {
  if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return cachedToken
  }

  const email = process.env.DEV_USER_EMAIL || 'dev@example.com'
  const password = process.env.DEV_USER_PASSWORD || 'DevPassword123!'

  // Helper to perform login
  const login = async () => {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      return null
    }

    const json = (await response.json()) as { token?: string }
    return json.token ?? null
  }

  // Try login first
  let token = await login()

  // If login fails, try register then login again
  if (!token) {
    await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Dev User', email, password }),
    })

    token = await login()
  }

  if (!token) {
    throw new Error('Unable to obtain backend auth token')
  }

  cachedToken = token
  // Backend token currently expires in 12 hours; keep a slightly shorter cache
  tokenExpiresAt = Date.now() + 11 * 60 * 60 * 1000

  return token
}

export async function backendFetchWithToken(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers: HeadersInit = {
    ...(init.headers || {}),
    Authorization: `Bearer ${token}`,
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
  })
}

export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return fetch(`${BACKEND_URL}${path}`, init)
  }

  const token = await getDevToken()
  const headers: HeadersInit = {
    ...(init.headers || {}),
    Authorization: `Bearer ${token}`,
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
  })
}
