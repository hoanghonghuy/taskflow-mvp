import { config } from '../../src/config'
import * as gemini from '../../src/services/geminiService'
import * as llm from '../../src/services/llmService'
import * as openai from '../../src/services/openaiService'

jest.mock('../../src/services/geminiService')
jest.mock('../../src/services/openaiService')

describe('llmService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(gemini.analyzeTask as jest.Mock).mockResolvedValue({ title: 'gemini' })
    ;(openai.analyzeTask as jest.Mock).mockResolvedValue({ title: 'openai' })
  })

  it('routes to gemini by default', async () => {
    config.ai.provider = 'gemini'
    const result = await llm.analyzeTask('en', 'text', 'key')
    expect(result.title).toBe('gemini')
    expect(gemini.analyzeTask).toHaveBeenCalled()
    expect(openai.analyzeTask).not.toHaveBeenCalled()
  })

  it('routes to openai when configured', async () => {
    config.ai.provider = 'openai'
    const result = await llm.analyzeTask('en', 'text', 'key')
    expect(result.title).toBe('openai')
    expect(openai.analyzeTask).toHaveBeenCalled()
    expect(gemini.analyzeTask).not.toHaveBeenCalled()
  })
})
