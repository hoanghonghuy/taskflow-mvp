import { parseJsonArray, parseJsonObject, toJsonString } from '../../src/lib/json'
import { hashPassword, verifyPassword } from '../../src/lib/password'
import { signToken, verifyToken } from '../../src/lib/jwt'

describe('lib/json', () => {
  it('parseJsonArray returns fallback on invalid input', () => {
    expect(parseJsonArray<string>(null)).toEqual([])
    expect(parseJsonArray<string>('bad')).toEqual([])
    expect(parseJsonArray<string>('["a"]')).toEqual(['a'])
    expect(parseJsonArray<string>('{}', ['x'])).toEqual(['x'])
  })

  it('parseJsonObject returns fallback on invalid input', () => {
    expect(parseJsonObject(null)).toBeNull()
    expect(parseJsonObject('bad', { a: 1 })).toEqual({ a: 1 })
    expect(parseJsonObject('{"x":1}')).toEqual({ x: 1 })
  })

  it('toJsonString', () => {
    expect(toJsonString([1, 2])).toBe('[1,2]')
    expect(toJsonString(undefined)).toBe('null')
  })
})

describe('lib/password', () => {
  it('hashes and verifies password', async () => {
    const hash = await hashPassword('secret123')
    expect(await verifyPassword('secret123', hash)).toBe(true)
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })
})

describe('lib/jwt', () => {
  it('signs and verifies token with user claims', () => {
    const token = signToken({ userId: 'user-1', email: 'a@test.com', name: 'A', role: 'USER' })
    const payload = verifyToken(token)
    expect(payload?.userId).toBe('user-1')
    expect(payload?.email).toBe('a@test.com')
    expect(payload?.role).toBe('USER')
  })

  it('returns null for invalid token', () => {
    expect(verifyToken('invalid')).toBeNull()
  })
})
