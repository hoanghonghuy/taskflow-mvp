import { prisma } from '../../lib/prisma'
import * as gemini from './gemini.service'

export async function buildBriefingContext(userId: string): Promise<string> {
  const [tasks, habits, sessions] = await Promise.all([
    prisma.todoTask.findMany({ where: { userId } }),
    prisma.habit.findMany({ where: { userId } }),
    prisma.pomodoroSession.findMany({ where: { userId } }),
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
  const content = await gemini.generateBriefing(lang, context)
  return { content }
}

export async function analyzeTask(
  text: string,
  language?: string,
): Promise<gemini.AnalyzeTaskResult> {
  if (!text?.trim()) {
    throw Object.assign(new Error('Text is required'), { statusCode: 400 })
  }
  return gemini.analyzeTask(language?.trim() || 'en', text)
}

export async function chat(
  messages: gemini.ChatMessage[],
  language?: string,
  thinkingMode?: boolean,
  searchGrounding?: boolean,
): Promise<{ content: string }> {
  const content = await gemini.chat(
    language?.trim() || 'en',
    messages,
    Boolean(thinkingMode),
    Boolean(searchGrounding),
  )
  return { content: content || ' ' }
}
