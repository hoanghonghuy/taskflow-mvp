import type { Task } from '@/types'

export type SearchMatchField = 'title' | 'description' | 'tag' | 'subtask' | 'comment'

export interface SearchMatchMeta {
  field: SearchMatchField
  snippet: string
}

function normalizeQuery(term: string): string {
  return term.trim().toLowerCase()
}

function snippetAround(text: string, query: string, maxLen = 72): string {
  const lower = text.toLowerCase()
  const index = lower.indexOf(query)
  if (index < 0) return text.slice(0, maxLen)

  const start = Math.max(0, index - 20)
  const end = Math.min(text.length, index + query.length + 40)
  let slice = text.slice(start, end).trim()
  if (start > 0) slice = `…${slice}`
  if (end < text.length) slice = `${slice}…`
  return slice
}

export function taskMatchesSearch(task: Task, term: string): boolean {
  const query = normalizeQuery(term)
  if (!query) return false

  if (task.title.toLowerCase().includes(query)) return true
  if (task.description?.toLowerCase().includes(query)) return true
  if (task.tags.some((tag) => tag.toLowerCase().includes(query))) return true
  if (task.subtasks.some((subtask) => subtask.title.toLowerCase().includes(query))) return true
  if (task.comments.some((comment) => comment.content.toLowerCase().includes(query))) return true

  return false
}

export function getSearchMatchMeta(task: Task, term: string): SearchMatchMeta | null {
  const query = normalizeQuery(term)
  if (!query) return null

  if (!task.title.toLowerCase().includes(query) && task.description?.toLowerCase().includes(query)) {
    return { field: 'description', snippet: snippetAround(task.description ?? '', query) }
  }

  const matchedTag = task.tags.find((tag) => tag.toLowerCase().includes(query))
  if (matchedTag && !task.title.toLowerCase().includes(query)) {
    return { field: 'tag', snippet: matchedTag }
  }

  const matchedSubtask = task.subtasks.find((subtask) => subtask.title.toLowerCase().includes(query))
  if (matchedSubtask && !task.title.toLowerCase().includes(query)) {
    return { field: 'subtask', snippet: snippetAround(matchedSubtask.title, query) }
  }

  const matchedComment = task.comments.find((comment) => comment.content.toLowerCase().includes(query))
  if (matchedComment && !task.title.toLowerCase().includes(query)) {
    return { field: 'comment', snippet: snippetAround(matchedComment.content, query) }
  }

  return null
}

export function filterTasksBySearch(tasks: Task[], term: string): Task[] {
  const query = term.trim()
  if (!query) return []
  return tasks.filter((task) => taskMatchesSearch(task, query))
}
