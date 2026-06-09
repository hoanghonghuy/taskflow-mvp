import { config } from '../../src/config'
import { analyzeTask, chat, generateBriefing, generateSubtasks } from '../../src/services/openaiService'

const originalFetch = global.fetch

describe('openai.service', () => {
  beforeEach(() => {
    config.ai.openaiApiKey = 'test-openai-key'
    config.ai.openaiBaseUrl = 'https://api.example.com/v1'
    config.ai.openaiModel = 'gpt-test'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'ok' } }],
      }),
    }) as unknown as typeof fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    config.ai.openaiApiKey = ''
  })

  it('throws when API key missing', async () => {
    config.ai.openaiApiKey = ''
    await expect(generateBriefing('en', 'ctx')).rejects.toMatchObject({ statusCode: 500 })
  })

  it('generateBriefing calls chat/completions', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Daily briefing' } }],
      }),
    }) as unknown as typeof fetch

    const text = await generateBriefing('en', 'context')
    expect(text).toBe('Daily briefing')
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'https://api.example.com/v1/chat/completions',
    )
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body as string)
    expect(body.model).toBe('gpt-test')
    expect(body.messages[0].role).toBe('user')
  })

  it('analyzeTask parses JSON block', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content:
                '{"title":"Buy milk","priority":"low","tags":["errands"],"dueDate":"2026-12-01"}',
            },
          },
        ],
      }),
    }) as unknown as typeof fetch

    const result = await analyzeTask('en', 'buy milk tomorrow')
    expect(result.title).toBe('Buy milk')
    expect(result.dueDate).toBeDefined()
  })

  it('generateSubtasks parses JSON block', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '{"subtasks":[{"title":"Step 1"},{"title":"Step 2"}]}',
            },
          },
        ],
      }),
    }) as unknown as typeof fetch

    const result = await generateSubtasks('en', 'Write report', 'Q1')
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Step 1')
  })

  it('chat sends system + history messages', async () => {
    await chat('vi', [{ role: 'user', text: 'Hi' }], true, false)
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body as string)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[1].role).toBe('user')
    expect(body.messages[0].content).toContain('Vietnamese')
  })

  it('throws on API error response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'unauthorized',
    }) as unknown as typeof fetch

    await expect(chat('en', [], false, false)).rejects.toMatchObject({ statusCode: 500 })
  })
})
