import { apiFetch, unwrapApiData } from './client'

export type AnalyzeTaskResult = {
  title?: string
  dueDate?: string | null
  priority?: string | null
  tags?: string[]
} | null

export type ChatBackendMessage = {
  role: string
  text: string
}

export type AiProvider = 'gemini' | 'openai'

export type AiStatus = {
  available: boolean
  provider: AiProvider
}

export async function fetchAiStatus(): Promise<AiStatus> {
  const response = await apiFetch('/api/ai/status')
  if (!response.ok) {
    return { available: false, provider: 'gemini' }
  }
  const json = await response.json().catch(() => null)
  const data = json ? unwrapApiData<{ available?: boolean; provider?: string }>(json, response.status) : null
  const provider = data?.provider === 'openai' ? 'openai' : 'gemini'
  return {
    available: Boolean(data?.available),
    provider,
  }
}

export async function analyzeTaskText(
  text: string,
  language: string,
): Promise<AnalyzeTaskResult> {
  const response = await apiFetch('/api/ai/tasks/analyze', {
    method: 'POST',
    body: JSON.stringify({ text, language }),
  })

  if (!response.ok) {
    throw new Error(`Failed to analyze task text: ${response.status}`)
  }

  const json = await response.json().catch(() => null)
  return json ? unwrapApiData<AnalyzeTaskResult>(json, response.status) : null
}

export async function fetchBriefing(language: string): Promise<string> {
  const response = await apiFetch('/api/ai/briefing', {
    method: 'POST',
    body: JSON.stringify({ language }),
  })

  if (!response.ok) {
    throw new Error(`Failed to load briefing: ${response.status}`)
  }

  const json = await response.json().catch(() => null)
  const data = json ? unwrapApiData<{ content?: string }>(json, response.status) : null
  const content = data && typeof data.content === 'string' ? data.content : ''
  if (!content) {
    throw new Error('Empty briefing content')
  }

  return content
}

export type GeneratedSubtask = {
  title: string
}

export async function generateSubtasks(
  title: string,
  description: string | undefined,
  language: string,
): Promise<GeneratedSubtask[]> {
  const response = await apiFetch('/api/ai/tasks/subtasks', {
    method: 'POST',
    body: JSON.stringify({ title, description: description || null, language }),
  })

  if (!response.ok) {
    throw new Error(`Failed to generate subtasks: ${response.status}`)
  }

  const json = await response.json().catch(() => null)
  const data = json ? unwrapApiData<{ subtasks?: GeneratedSubtask[] }>(json, response.status) : null
  return Array.isArray(data?.subtasks) ? data.subtasks : []
}

export async function sendChatMessage(payload: {
  messages: ChatBackendMessage[]
  language: string
  thinkingMode?: boolean
  searchGrounding?: boolean
}): Promise<string> {
  const response = await apiFetch('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Failed to send chat message: ${response.status}`)
  }

  const json = await response.json().catch(() => null)
  const data = json ? unwrapApiData<{ content?: string }>(json, response.status) : null
  const reply = data && typeof data.content === 'string' ? data.content.trim() : ''
  if (!reply) {
    throw new Error('Empty chat response')
  }

  return reply
}
