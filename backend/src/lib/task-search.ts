import { parseJsonArray } from './json'

type SearchableSubtask = { title?: string }
type SearchableComment = { content?: string }

/** User-facing fields only — ignores JSON metadata keys (id, completed, userId, …). */
export function taskMatchesUserFacingSearch(
  task: {
    title: string
    description?: string | null
    tags?: string[] | null
    subtasks?: SearchableSubtask[] | string | null
    comments?: SearchableComment[] | string | null
  },
  rawQuery: string,
): boolean {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return false

  if (task.title.toLowerCase().includes(query)) return true
  if (task.description?.toLowerCase().includes(query)) return true

  const tags = Array.isArray(task.tags)
    ? task.tags
    : parseJsonArray<string>(typeof task.tags === 'string' ? task.tags : null, [])
  if (tags.some((tag) => String(tag).toLowerCase().includes(query))) return true

  const subtasks = Array.isArray(task.subtasks)
    ? task.subtasks
    : parseJsonArray<SearchableSubtask>(
        typeof task.subtasks === 'string' ? task.subtasks : null,
        [],
      )
  if (subtasks.some((s) => String(s.title ?? '').toLowerCase().includes(query))) return true

  const comments = Array.isArray(task.comments)
    ? task.comments
    : parseJsonArray<SearchableComment>(
        typeof task.comments === 'string' ? task.comments : null,
        [],
      )
  if (comments.some((c) => String(c.content ?? '').toLowerCase().includes(query))) return true

  return false
}
