import { decryptSecret, encryptSecret } from '../../src/lib/crypto'

describe('lib/crypto', () => {
  const originalKey = process.env.USER_SECRET_ENC_KEY

  beforeEach(() => {
    delete process.env.USER_SECRET_ENC_KEY
  })

  afterAll(() => {
    if (originalKey) {
      process.env.USER_SECRET_ENC_KEY = originalKey
    } else {
      delete process.env.USER_SECRET_ENC_KEY
    }
  })

  it('roundtrips a plaintext secret', () => {
    const plain = 'AIzaSyA-test-key-with-special-chars!@#$%^&*()'
    const stored = encryptSecret(plain)
    expect(stored).not.toContain(plain)
    expect(stored.split(':')).toHaveLength(3)
    expect(decryptSecret(stored)).toBe(plain)
  })

  it('returns empty string for empty input on encrypt', () => {
    expect(encryptSecret('')).toBe('')
    expect(encryptSecret(null as unknown as string)).toBe('')
  })

  it('returns empty string for empty stored value on decrypt', () => {
    expect(decryptSecret('')).toBe('')
  })

  it('throws on invalid format', () => {
    expect(() => decryptSecret('not-a-valid-format')).toThrow('Invalid encrypted secret format')
    expect(() => decryptSecret('a:b')).toThrow('Invalid encrypted secret format')
  })

  it('throws on tampered ciphertext (auth tag mismatch)', () => {
    const stored = encryptSecret('original-secret')
    const parts = stored.split(':')
    // Flip a hex char in ciphertext
    const tamperedCipher = parts[2].startsWith('0')
      ? '1' + parts[2].slice(1)
      : '0' + parts[2].slice(1)
    const tampered = `${parts[0]}:${parts[1]}:${tamperedCipher}`
    expect(() => decryptSecret(tampered)).toThrow()
  })

  it('uses USER_SECRET_ENC_KEY when provided', () => {
    process.env.USER_SECRET_ENC_KEY = 'a'.repeat(64) // 32 bytes hex
    const plain = 'secret-with-explicit-key'
    const stored = encryptSecret(plain)
    expect(decryptSecret(stored)).toBe(plain)
  })

  it('rejects invalid USER_SECRET_ENC_KEY length', () => {
    process.env.USER_SECRET_ENC_KEY = 'aabb' // too short
    expect(() => encryptSecret('test')).toThrow('USER_SECRET_ENC_KEY must decode to')
  })

  it('produces different ciphertext for same input (random IV)', () => {
    const a = encryptSecret('same-input')
    const b = encryptSecret('same-input')
    expect(a).not.toBe(b)
    expect(decryptSecret(a)).toBe('same-input')
    expect(decryptSecret(b)).toBe('same-input')
  })
})
