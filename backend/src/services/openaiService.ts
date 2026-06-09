import { config } from '../config'
import {
  extractJsonBlock,
  languageLabel,
  parseAnalyzeTaskJson,
  parseSubtasksJson,
  type AnalyzeTaskResult,
  type ChatMessage,
  type GeneratedSubtask,
} from '../lib/ai-common'
import { AppError } from '../middleware/errorHandler'

interface OpenAIChatResponse {
  choices?: Array<{
    message?: { content?: string | null }
  }>
}

function resolveApiKey(apiKey?: string): string {
  const key = apiKey?.trim() || config.ai.openaiApiKey?.trim()
  if (!key) {
    throw new AppError(500, 'internal_server_error', 'OpenAI API key is not configured.')
  }
  return key
}

async function chatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  apiKey?: string,
): Promise<string> {
  const key = resolveApiKey(apiKey)
  const baseUrl = config.ai.openaiBaseUrl.replace(/\/$/, '')

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: config.ai.openaiModel,
      messages,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new AppError(
      500,
      'internal_server_error',
      `OpenAI API call failed with status ${response.status}: ${errorBody}`,
    )
  }

  const payload = (await response.json()) as OpenAIChatResponse
  const text = payload.choices?.[0]?.message?.content
  return typeof text === 'string' ? text : ''
}

async function generateText(prompt: string, apiKey?: string): Promise<string> {
  return chatCompletion([{ role: 'user', content: prompt }], apiKey)
}

export async function generateBriefing(
  language: string,
  context: string,
  apiKey?: string,
): Promise<string> {
  const prompt = `You are an assistant helping a user plan their day based on their tasks, habits and focus sessions.

Language: ${languageLabel(language)}.

Context:
${context}

Write a short daily briefing in markdown (use headings and bullet lists), at most 250 words.`

  return generateText(prompt, apiKey)
}

export async function analyzeTask(
  language: string,
  text: string,
  apiKey?: string,
): Promise<AnalyzeTaskResult> {
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
  return parseAnalyzeTaskJson(extractJsonBlock(raw), text)
}

export async function generateSubtasks(
  language: string,
  title: string,
  description: string | null | undefined,
  apiKey?: string,
): Promise<GeneratedSubtask[]> {
  const details = description?.trim()
    ? `\nDescription:\n${description.trim()}`
    : ''

  const prompt = `You help users break a task into actionable subtasks.

Task title: ${title}${details}

Respond ONLY with a single JSON object with one key:
- "subtasks": array of objects, each with "title" (string)

Generate 3 to 7 concise subtasks in ${languageLabel(language)}.
Do not include any extra commentary outside the JSON.`

  const raw = await generateText(prompt, apiKey)
  return parseSubtasksJson(extractJsonBlock(raw))
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

  const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemIntro },
    ...messages.map((m) => ({
      role: (m.role.toLowerCase() === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.text,
    })),
  ]

  return chatCompletion(chatMessages, apiKey)
}
