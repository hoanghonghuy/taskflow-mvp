describe('config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('uses defaults for missing JWT_KEY in development', async () => {
    delete process.env.JWT_KEY
    process.env.NODE_ENV = 'development'
    const { config } = await import('../../src/config')
    expect(config.jwt.key).toContain('dev-jwt')
  })

  it('fails fast for missing JWT_KEY in production', async () => {
    delete process.env.JWT_KEY
    process.env.NODE_ENV = 'production'
    await expect(import('../../src/config')).rejects.toThrow('Required JWT_KEY is missing')
  })

  it('reads PORT from environment', async () => {
    process.env.PORT = '5134'
    const { config } = await import('../../src/config')
    expect(config.port).toBe(5134)
  })

  it('parses AI_PROVIDER openai-compatible aliases', async () => {
    process.env.AI_PROVIDER = 'openai-compatible'
    const { config } = await import('../../src/config')
    expect(config.ai.provider).toBe('openai')
  })

  it('defaults AI_PROVIDER to gemini', async () => {
    delete process.env.AI_PROVIDER
    const { config } = await import('../../src/config')
    expect(config.ai.provider).toBe('gemini')
  })
})
