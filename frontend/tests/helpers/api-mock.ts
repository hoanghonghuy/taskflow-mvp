import type { NextApiRequest, NextApiResponse } from 'next'
import { vi, type Mock } from 'vitest'

export type ApiMocks = {
  req: NextApiRequest
  res: NextApiResponse
  status: Mock<(code: number) => { json: Mock; end: Mock }>
  json: Mock
  end: Mock
  setHeader: Mock
}

export function createApiMocks(
  method: string,
  options: {
    query?: Record<string, string | string[]>
    body?: unknown
    headers?: Record<string, string>
  } = {},
) {
  const json = vi.fn() as Mock
  const end = vi.fn() as Mock
  const status = vi.fn(() => ({ json, end })) as Mock<
    (code: number) => { json: Mock; end: Mock }
  >
  const setHeader = vi.fn() as Mock

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

  return { req, res, status, json, end, setHeader } satisfies ApiMocks
}

type ApiRouteHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
) => void | Promise<void | NextApiResponse>

export async function runHandler(
  handler: ApiRouteHandler,
  method: string,
  options?: Parameters<typeof createApiMocks>[1],
) {
  const mocks = createApiMocks(method, options)
  await handler(mocks.req, mocks.res)
  return mocks
}
