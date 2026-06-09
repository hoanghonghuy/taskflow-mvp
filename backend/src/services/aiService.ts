import { config } from '../config'
import { AppError } from '../middleware/errorHandler'
import * as habitRepository from '../repositories/habitRepository'
import * as pomodoroRepository from '../repositories/pomodoroRepository'
import * as settingsRepository from '../repositories/settingsRepository'
import * as taskRepository from '../repositories/taskRepository'
import * as gemini from './geminiService'

export async function isAiAvailable(userId: string): Promise<boolean> {
  const key = await resolveGeminiApiKey(userId)
  return Boolean(key)
}

async function resolveGeminiApiKey(userId: string): Promise<string | undefined> {
  const settings = await settingsRepository.findByUserId(userId)
  const userKey = settings?.geminiApiKey?.trim()
  if (userKey) return userKey
  if (config.geminiApiKey?.trim()) return config.geminiApiKey.trim()
  return undefined
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
  const apiKey = await resolveGeminiApiKey(userId)
  const content = await gemini.generateBriefing(lang, context, apiKey)
  return { content }
}

export async function analyzeTask(
  userId: string,
  text: string,
  language?: string,
): Promise<gemini.AnalyzeTaskResult> {
  if (!text?.trim()) {
    throw new AppError(400, 'invalid_request', 'Text is required')
  }
  const apiKey = await resolveGeminiApiKey(userId)
  return gemini.analyzeTask(language?.trim() || 'en', text, apiKey)
}

export async function chat(
  userId: string,
  messages: gemini.ChatMessage[],
  language?: string,
  thinkingMode?: boolean,
  searchGrounding?: boolean,
): Promise<{ content: string }> {
  const apiKey = await resolveGeminiApiKey(userId)
  const content = await gemini.chat(
    language?.trim() || 'en',
    messages,
    Boolean(thinkingMode),
    Boolean(searchGrounding),
    apiKey,
  )
  return { content: content || ' ' }
}
