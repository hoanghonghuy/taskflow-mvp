import { config } from '../config'
import { AppError } from '../middleware/errorHandler'

const MODEL = 'gemini-1.5-flash'
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
  }>
}

function resolveApiKey(apiKey?: string): string {
  const key = apiKey?.trim() || config.geminiApiKey?.trim()
  if (!key) {
    throw new AppError(500, 'internal_server_error', 'Gemini API key is not configured.')
  }
  return key
}

async function generateText(prompt: string, apiKey?: string): Promise<string> {
  const key = resolveApiKey(apiKey)

  const response = await fetch(
    `${BASE_URL}/models/${MODEL}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw new AppError(
      500,
      'internal_server_error',
      `Gemini API call failed with status ${response.status}: ${errorBody}`,
    )
  }

  const payload = (await response.json()) as GeminiResponse
  const text = payload.candidates
    ?.flatMap((c) => c.content?.parts ?? [])
    .map((p) => p.text)
    .find((t) => t && t.trim())

  return text ?? ''
}

function languageLabel(language: string): string {
  return language.toLowerCase().startsWith('vi') ? 'Vietnamese' : 'English'
}

export async function generateBriefing(language: string, context: string, apiKey?: string): Promise<string> {
  const prompt = `You are an assistant helping a user plan their day based on their tasks, habits and focus sessions.

Language: ${languageLabel(language)}.

Context:
${context}

Write a short daily briefing in markdown (use headings and bullet lists), at most 250 words.`

  return generateText(prompt, apiKey)
}

function extractJsonBlock(text: string): string | null {
  if (!text.trim()) return null

  const fenced = text.match(/```json\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()

  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first >= 0 && last > first) {
    return text.slice(first, last + 1)
  }

  return null
}

export interface AnalyzeTaskResult {
  title: string
  dueDate?: string | null
  priority?: string
  tags?: string[]
}

export async function analyzeTask(language: string, text: string, apiKey?: string): Promise<AnalyzeTaskResult> {
  const prompt = `You help users convert free-form text into a structured task.

User input:
${text}

Respond ONLY with a single JSON object. The object must have these keys:
- "title": string
- "dueDate": string or null (ISO 8601 date)
- "priority": one of: "none", "low", "medium", "high", "urgent"
- "tags": array of strings

Use ${languageLabel(language)} for values where applicable (except priority which must be one of the fixed literals).
Do not include any extra commentary outside the JSON.`

  const raw = await generateText(prompt, apiKey)
  const json = extractJsonBlock(raw)

  if (!json) {
    return {
      title: text.trim() || 'New task',
      priority: 'none',
      tags: [],
    }
  }

  try {
    const parsed = JSON.parse(json) as Record<string, unknown>
    const result: AnalyzeTaskResult = {
      title: String(parsed.title ?? '').trim() || text.trim() || 'New task',
      priority: String(parsed.priority ?? 'none'),
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.map(String).filter((t) => t.trim())
        : [],
    }

    if (parsed.dueDate != null) {
      const due = String(parsed.dueDate)
      if (due && !Number.isNaN(Date.parse(due))) {
        result.dueDate = new Date(due).toISOString()
      }
    }

    return result
  } catch {
    return {
      title: text.trim() || 'New task',
      priority: 'none',
      tags: [],
    }
  }
}

export interface ChatMessage {
  role: string
  text: string
}

export async function chat(
  language: string,
  messages: ChatMessage[],
  thinkingMode: boolean,
  searchGrounding: boolean,
  apiKey?: string,
): Promise<string> {
  let systemIntro = `You are Taskflow's AI assistant, helping the user with productivity, tasks and planning. Answer in ${languageLabel(language)}.`

  if (thinkingMode) {
    systemIntro += ' You may reason step by step, but keep the final answer concise.'
  }
  if (searchGrounding) {
    systemIntro +=
      ' You may mention that external information may be outdated and should be verified.'
  }

  const history = messages
    .map((m) => {
      const role = m.role.toLowerCase() === 'user' ? 'User' : 'Assistant'
      return `${role}: ${m.text}`
    })
    .join('\n\n')

  const prompt = `${systemIntro}\n\nConversation so far:\n${history}\n\nAssistant:`
  return generateText(prompt, apiKey)
}
