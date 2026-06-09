import type { NextApiRequest, NextApiResponse } from 'next'
import { vi } from 'vitest'

export function createApiMocks(
  method: string,
  options: {
    query?: Record<string, string | string[]>
    body?: unknown
    headers?: Record<string, string>
  } = {},
) {
  const json = vi.fn()
  const end = vi.fn()
  const status = vi.fn(() => ({ json, end }))
  const setHeader = vi.fn()

  const req = {
    method,
    query: options.query ?? {},
    body: options.body ?? {},
    headers: options.headers ?? {},
  } as unknown as NextApiRequest

  const res = {
    status,
    json,
    end,
    setHeader,
  } as unknown as NextApiResponse

  return { req, res, status, json, end, setHeader }
}

export async function runHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  method: string,
  options?: Parameters<typeof createApiMocks>[1],
) {
  const mocks = createApiMocks(method, options)
  await handler(mocks.req, mocks.res)
  return mocks
}
