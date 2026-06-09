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

  it('reads PORT from environment', async () => {
    process.env.PORT = '5134'
    const { config } = await import('../../src/config')
    expect(config.port).toBe(5134)
  })
})
