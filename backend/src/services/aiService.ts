import { config } from '../config'
import { decryptSecret } from '../lib/crypto'
import { AppError } from '../middleware/errorHandler'
import * as habitRepository from '../repositories/habitRepository'
import * as pomodoroRepository from '../repositories/pomodoroRepository'
import * as settingsRepository from '../repositories/settingsRepository'
import * as taskRepository from '../repositories/taskRepository'
import * as llm from './llmService'

export async function isAiAvailable(userId: string): Promise<boolean> {
  const key = await resolveAiApiKey(userId)
  return Boolean(key)
}

export function getAiProvider(): typeof config.ai.provider {
  return config.ai.provider
}

async function resolveAiApiKey(userId: string): Promise<string | undefined> {
  const settings = await settingsRepository.findByUserId(userId)
  if (settings?.geminiApiKey) {
    // geminiApiKey lưu dạng AES-GCM ciphertext; decrypt để dùng.
    try {
      const userKey = decryptSecret(settings.geminiApiKey).trim()
      if (userKey) return userKey
    } catch {
      // Fallback: nếu DB cũ còn plaintext, dùng trực tiếp rồi encrypt lại.
      const plain = settings.geminiApiKey.trim()
      if (plain) return plain
    }
  }

  if (config.ai.provider === 'openai') {
    return config.ai.openaiApiKey?.trim() || undefined
  }
  return config.ai.geminiApiKey?.trim() || undefined
}

export async function buildBriefingContext(userId: string): Promise<string> {
  const [tasks, habits, sessions] = await Promise.all([
    taskRepository.findTasksByUserId(userId),
    habitRepository.findHabitsByUserId(userId),
    pomodoroRepository.findSessionsByUserId(userId),
  ])

  const today = new Date().toISOString().slice(0, 10)
  const lines: string[] = [
    `Total tasks: ${tasks.length}`,
    `Completed tasks: ${tasks.filter((t) => t.completed).length}`,
    `Habits: ${habits.length}`,
    `Focus sessions: ${sessions.length}`,
    '',
  ]

  const todayTasks = tasks
    .filter((t) => t.dueDate && t.dueDate.toISOString().slice(0, 10) === today)
    .slice(0, 20)

  if (todayTasks.length > 0) {
    lines.push('Tasks due today:')
    for (const t of todayTasks) {
      lines.push(`- ${t.title}`)
    }
  }

  return lines.join('\n')
}

export async function briefing(userId: string, language?: string): Promise<{ content: string }> {
  const context = await buildBriefingContext(userId)
  const lang = language?.trim() || 'en'
  const apiKey = await resolveAiApiKey(userId)
  const content = await llm.generateBriefing(lang, context, apiKey)
  return { content }
}

export async function analyzeTask(
  userId: string,
  text: string,
  language?: string,
): Promise<llm.AnalyzeTaskResult> {
  if (!text?.trim()) {
    throw new AppError(400, 'invalid_request', 'Text is required')
  }
  const apiKey = await resolveAiApiKey(userId)
  return llm.analyzeTask(language?.trim() || 'en', text, apiKey)
}

export async function generateSubtasks(
  userId: string,
  title: string,
  description: string | null | undefined,
  language?: string,
): Promise<{ subtasks: llm.GeneratedSubtask[] }> {
  const apiKey = await resolveAiApiKey(userId)
  const subtasks = await llm.generateSubtasks(
    language?.trim() || 'en',
    title,
    description,
    apiKey,
  )
  return { subtasks }
}

export async function chat(
  userId: string,
  messages: llm.ChatMessage[],
  language?: string,
  thinkingMode?: boolean,
  searchGrounding?: boolean,
): Promise<{ content: string }> {
  const apiKey = await resolveAiApiKey(userId)
  const content = await llm.chat(
    language?.trim() || 'en',
    messages,
    Boolean(thinkingMode),
    Boolean(searchGrounding),
    apiKey,
  )
  return { content: content || ' ' }
}
