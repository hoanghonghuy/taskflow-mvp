import { config } from '../../src/config'
import { analyzeTask, chat, generateBriefing } from '../../src/services/geminiService'

const originalFetch = global.fetch

describe('gemini.service', () => {
  beforeEach(() => {
    config.geminiApiKey = 'test-key'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'ok' }] } }],
      }),
    }) as unknown as typeof fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    config.geminiApiKey = ''
  })

  it('throws when API key missing', async () => {
    config.geminiApiKey = ''
    await expect(generateBriefing('en', 'ctx')).rejects.toMatchObject({ statusCode: 500 })
  })

  it('generateBriefing returns text from API', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Daily briefing' }] } }],
      }),
    }) as unknown as typeof fetch

    const text = await generateBriefing('en', 'context')
    expect(text).toBe('Daily briefing')
  })

  it('generateBriefing uses Vietnamese label', async () => {
    await generateBriefing('vi', 'ctx')
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body as string)
    expect(body.contents[0].parts[0].text).toContain('Vietnamese')
  })

  it('analyzeTask parses JSON block', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '```json\n{"title":"Buy milk","priority":"low","tags":["errands"],"dueDate":"2026-12-01"}\n```',
                },
              ],
            },
          },
        ],
      }),
    }) as unknown as typeof fetch

    const result = await analyzeTask('en', 'buy milk tomorrow')
    expect(result.title).toBe('Buy milk')
    expect(result.dueDate).toBeDefined()
  })

  it('analyzeTask falls back when JSON missing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'plain text only' }] } }],
      }),
    }) as unknown as typeof fetch

    const result = await analyzeTask('en', '  my task  ')
    expect(result.title).toBe('my task')
    expect(result.priority).toBe('none')
  })

  it('analyzeTask falls back on invalid JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{broken json' }] } }],
      }),
    }) as unknown as typeof fetch

    const result = await analyzeTask('en', 'fallback title')
    expect(result.title).toBe('fallback title')
  })

  it('chat returns assistant text', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Hello!' }] } }],
      }),
    }) as unknown as typeof fetch

    const text = await chat('vi', [{ role: 'user', text: 'Hi' }], true, true)
    expect(text).toBe('Hello!')
  })

  it('throws on API error response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'rate limited',
    }) as unknown as typeof fetch

    await expect(chat('en', [], false, false)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('returns empty string when no candidate text', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [] }),
    }) as unknown as typeof fetch

    const text = await generateBriefing('en', 'ctx')
    expect(text).toBe('')
  })
})
