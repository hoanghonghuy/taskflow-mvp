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
  // Dùng aggregate + top N thay vì load hết tasks/habits/sessions về memory.
  // User có 10k tasks trước đây sẽ OOM; giờ chỉ cần top 20 due hôm nay.
  const since = new Date()
  since.setDate(since.getDate() - 7) // 7 ngày gần nhất cho focus stats

  const [tasks, habits, recentSessions] = await Promise.all([
    taskRepository.findTasksBriefingSummary(userId, {
      todayTopN: 20,
      dueBefore: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }),
    habitRepository.findHabitsSummary(userId),
    pomodoroRepository.findSessionsByUserId(userId, { take: 20, since }),
  ])

  const lines: string[] = [
    `Total tasks: ${tasks.total}`,
    `Completed tasks: ${tasks.completed}`,
    `Pending tasks: ${tasks.pending}`,
    `Total habits: ${habits.total}`,
    `Focus sessions (last 7 days): ${recentSessions.length}`,
    '',
  ]

  if (tasks.dueTodayTop.length > 0) {
    lines.push('Tasks due today or overdue (top 20 by priority):')
    for (const t of tasks.dueTodayTop) {
      lines.push(`- [${t.priority}] ${t.title}`)
    }
    lines.push('')
  }

  if (habits.recent.length > 0) {
    lines.push('Recent habits:')
    for (const h of habits.recent) {
      lines.push(`- ${h.name}`)
    }
    lines.push('')
  }

  if (recentSessions.length > 0) {
    const focusSeconds = recentSessions
      .filter((s) => s.type === 'focus')
      .reduce((sum, s) => sum + s.durationSeconds, 0)
    lines.push(`Total focus time (last 7 days): ${Math.round(focusSeconds / 60)} min`)
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
