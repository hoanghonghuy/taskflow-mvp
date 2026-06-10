import { config } from '../../src/config'
import { analyzeTask, chat, generateBriefing, generateSubtasks } from '../../src/services/geminiService'

const originalFetch = global.fetch

describe('gemini.service', () => {
  beforeEach(() => {
    config.geminiApiKey = 'test-key'
    config.ai.geminiApiKey = 'test-key'
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
    config.ai.geminiApiKey = ''
  })

  it('throws when API key missing', async () => {
    config.geminiApiKey = ''
    config.ai.geminiApiKey = ''
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

  it('chat handles assistant role in history', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Response' }] } }],
      }),
    }) as unknown as typeof fetch

    await chat('en', [{ role: 'assistant', text: 'Previous' }, { role: 'user', text: 'Hi' }], false, false)
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body as string)
    expect(body.contents.length).toBeGreaterThan(0)
  })

  it('chat with search grounding enabled', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Grounded response' }] } }],
      }),
    }) as unknown as typeof fetch

    const text = await chat('en', [{ role: 'user', text: 'Query' }], false, true)
    expect(text).toBe('Grounded response')
  })

  it('chat handles empty parts response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [] } }],
      }),
    }) as unknown as typeof fetch

    const result = await chat('en', [], false, false)
    expect(result).toBe('')
  })

  it('chat handles non-string text in parts', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: null }] } }],
      }),
    }) as unknown as typeof fetch

    const result = await chat('en', [], false, false)
    expect(result).toBe('')
  })

  it('throws on API error response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'rate limited',
    }) as unknown as typeof fetch

    await expect(chat('en', [], false, false)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('generateSubtasks parses JSON block', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '{"subtasks":[{"title":"Draft outline"},{"title":"Review"}]}',
                },
              ],
            },
          },
        ],
      }),
    }) as unknown as typeof fetch

    const result = await generateSubtasks('en', 'Write report', 'Q1 summary')
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Draft outline')
  })

  it('generateSubtasks returns empty array when JSON missing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'no json here' }] } }],
      }),
    }) as unknown as typeof fetch

    const result = await generateSubtasks('en', 'Task', null)
    expect(result).toEqual([])
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
