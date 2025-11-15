import { Task, GroundingSource, Habit, ChatMessage } from '../types'

type GeminiClient = { readonly isMock: boolean } | null

export const analyzeTextForTask = async (_ai: GeminiClient, text: string): Promise<Partial<Task>> => {
  const title = text.split(/[.!?\n]/)[0]?.trim() || 'New Task'

  return {
    title,
    description: text,
    dueDate: undefined,
    subtasks: [],
  }
}

export const generateSubtasks = async (_ai: GeminiClient, taskTitle: string): Promise<string[]> => {
  if (!taskTitle) return []
  const templates = ['Plan', 'Prepare', 'Execute', 'Review']
  return templates.map((prefix, index) => `${prefix} ${taskTitle.toLowerCase()} step ${index + 1}`)
}

export const getGroundedInfo = async (_ai: GeminiClient, query: string): Promise<{ summary: string; sources: GroundingSource[] }> => {
  return {
    summary: `Mocked insight for “${query}”. Connect the backend Gemini client to replace this text with live data.`,
    sources: [],
  }
}

export async function* getChatResponseStream(
  _ai: GeminiClient,
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  _options: { useThinkingMode: boolean; useSearchGrounding: boolean }
): AsyncGenerator<{ text: string }> {
  const promptCount = history.length + 1
  yield { text: `Mock response ${promptCount}: ${newMessage}` }
}

export const generateDailyBriefing = async (_ai: GeminiClient, tasks: Task[], habits: Habit[]): Promise<string> => {
  const dueToday = tasks.filter(task => task.dueDate && task.dueDate.slice(0, 10) === new Date().toISOString().slice(0, 10))
  const pendingHabits = habits.filter(habit => !habit.completions.includes(new Date().toISOString().slice(0, 10)))

  return [
    '# Daily Briefing (Mock)',
    '',
    '## Focus Tasks',
    ...dueToday.map(task => `- ${task.title}`),
    '',
    '## Habit Reminders',
    ...pendingHabits.map(habit => `- ${habit.name}`),
    '',
    '_Connect the Gemini backend service to replace this placeholder summary._',
  ].join('\n')
}

export const generateChatSummaries = async (
  _ai: GeminiClient,
  history: ChatMessage[]
): Promise<{ summary: string; actionItems: string[] }> => {
  const summary = history.map(message => `${message.role}: ${message.text}`).join(' \n') || 'No conversation yet.'

  return {
    summary,
    actionItems: ['Integrate the real Gemini API to enable AI-assisted summaries.'],
  }
}
