import request from 'supertest'
import { resetAiRateLimitBuckets } from '../../src/middleware/ai-rate-limit'
import { app, authHeader, registerAndLogin, resetDatabase } from '../helpers'

const originalFetch = global.fetch

describe('AI routes', () => {
  let token: string

  beforeEach(async () => {
    await resetDatabase()
    ;({ token } = await registerAndLogin('ai@test.com'))
    global.fetch = originalFetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('briefing returns 500 without API key', async () => {
    const res = await request(app)
      .post('/api/ai/briefing')
      .set(authHeader(token))
      .send({ language: 'en' })
      .expect(500)
    expect(res.body.error).toBeDefined()
  })

  it('briefing returns content when Gemini succeeds', async () => {
    const { config } = await import('../../src/config')
    config.geminiApiKey = 'test-key'

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '# Briefing\n- Task 1' }] } }],
      }),
    }) as unknown as typeof fetch

    const res = await request(app)
      .post('/api/ai/briefing')
      .set(authHeader(token))
      .send({ language: 'en' })
      .expect(200)

    expect(res.body.content).toContain('Briefing')
  })

  it('chat returns content', async () => {
    const { config } = await import('../../src/config')
    config.geminiApiKey = 'test-key'

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Sure, I can help.' }] } }],
      }),
    }) as unknown as typeof fetch

    const res = await request(app)
      .post('/api/ai/chat')
      .set(authHeader(token))
      .send({
        messages: [{ role: 'user', text: 'Hello' }],
        language: 'en',
        thinkingMode: false,
        searchGrounding: false,
      })
      .expect(200)

    expect(res.body.content).toBeTruthy()
  })

  it('analyze returns parsed task fields', async () => {
    const { config } = await import('../../src/config')
    config.geminiApiKey = 'test-key'

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '{"title":"Call mom","priority":"medium","tags":["family"]}',
                },
              ],
            },
          },
        ],
      }),
    }) as unknown as typeof fetch

    const res = await request(app)
      .post('/api/ai/tasks/analyze')
      .set(authHeader(token))
      .send({ text: 'call mom', language: 'en' })
      .expect(200)

    expect(res.body.title).toBe('Call mom')
  })

  it('status returns available=false without API key', async () => {
    const { config } = await import('../../src/config')
    config.geminiApiKey = ''

    const res = await request(app)
      .get('/api/ai/status')
      .set(authHeader(token))
      .expect(200)

    expect(res.body.available).toBe(false)
  })

  it('status returns available=true when user has gemini key', async () => {
    await request(app)
      .put('/api/settings')
      .set(authHeader(token))
      .send({ geminiApiKey: 'user-key' })
      .expect(200)

    const res = await request(app)
      .get('/api/ai/status')
      .set(authHeader(token))
      .expect(200)

    expect(res.body.available).toBe(true)
  })

  it('returns 429 when AI rate limit exceeded', async () => {
    resetAiRateLimitBuckets()

    let lastStatus = 0
    for (let i = 0; i < 31; i += 1) {
      const res = await request(app)
        .post('/api/ai/briefing')
        .set(authHeader(token))
        .send({ language: 'en' })
      lastStatus = res.status
    }

    expect(lastStatus).toBe(429)
  })
})
