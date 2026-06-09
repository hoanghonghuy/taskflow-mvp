export type AiProvider = 'gemini' | 'openai'

export interface AnalyzeTaskResult {
  title: string
  dueDate?: string | null
  priority?: string
  tags?: string[]
}

export interface GeneratedSubtask {
  title: string
}

export interface ChatMessage {
  role: string
  text: string
}

export function languageLabel(language: string): string {
  return language.toLowerCase().startsWith('vi') ? 'Vietnamese' : 'English'
}

export function extractJsonBlock(text: string): string | null {
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

export function parseAnalyzeTaskJson(
  json: string | null,
  fallbackText: string,
): AnalyzeTaskResult {
  if (!json) {
    return {
      title: fallbackText.trim() || 'New task',
      priority: 'none',
      tags: [],
    }
  }

  try {
    const parsed = JSON.parse(json) as Record<string, unknown>
    const result: AnalyzeTaskResult = {
      title: String(parsed.title ?? '').trim() || fallbackText.trim() || 'New task',
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
      title: fallbackText.trim() || 'New task',
      priority: 'none',
      tags: [],
    }
  }
}

export function parseSubtasksJson(json: string | null): GeneratedSubtask[] {
  if (!json) return []

  try {
    const parsed = JSON.parse(json) as Record<string, unknown>
    const items = Array.isArray(parsed.subtasks) ? parsed.subtasks : []
    return items
      .map((item) => {
        if (typeof item === 'string') return { title: item.trim() }
        if (item && typeof item === 'object' && 'title' in item) {
          return { title: String((item as { title?: unknown }).title ?? '').trim() }
        }
        return { title: '' }
      })
      .filter((s) => s.title.length > 0)
  } catch {
    return []
  }
}
