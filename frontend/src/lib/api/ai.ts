import { apiFetch } from './client'

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

export async function fetchAiStatus(): Promise<boolean> {
  const response = await apiFetch('/api/ai/status')
  if (!response.ok) return false
  const data = (await response.json().catch(() => null)) as { available?: boolean } | null
  return Boolean(data?.available)
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

  return response.json().catch(() => null) as Promise<AnalyzeTaskResult>
}

export async function fetchBriefing(language: string): Promise<string> {
  const response = await apiFetch('/api/ai/briefing', {
    method: 'POST',
    body: JSON.stringify({ language }),
  })

  if (!response.ok) {
    throw new Error(`Failed to load briefing: ${response.status}`)
  }

  const data = (await response.json().catch(() => null)) as { content?: string }
  const content = data && typeof data.content === 'string' ? data.content : ''
  if (!content) {
    throw new Error('Empty briefing content')
  }

  return content
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

  const data = (await response.json().catch(() => null)) as { content?: string } | null
  const reply = data && typeof data.content === 'string' ? data.content.trim() : ''
  if (!reply) {
    throw new Error('Empty chat response')
  }

  return reply
}
