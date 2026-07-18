import { describe, expect, it } from 'vitest'
import type { Task } from '@/types'
import {
  filterTasksBySearch,
  getSearchMatchMeta,
  taskMatchesSearch,
} from '@/lib/utils/search-helpers'

const baseTask: Task = {
  id: 't1',
  title: 'Pay electricity bill',
  description: 'Transfer before Friday',
  completed: false,
  priority: 'medium',
  listId: 'inbox',
  tags: ['finance'],
  subtasks: [{ id: 's1', title: 'Check meter reading', completed: false }],
  comments: [{ id: 'c1', userId: 'u1', content: 'Ask landlord for receipt', timestamp: '2026-06-01' }],
}

describe('search-helpers', () => {
  it('matches title, tags, subtasks, and comments', () => {
    expect(taskMatchesSearch(baseTask, 'electricity')).toBe(true)
    expect(taskMatchesSearch(baseTask, 'finance')).toBe(true)
    expect(taskMatchesSearch(baseTask, 'meter')).toBe(true)
    expect(taskMatchesSearch(baseTask, 'landlord')).toBe(true)
    expect(taskMatchesSearch(baseTask, 'missing')).toBe(false)
  })

  it('filterTasksBySearch returns empty for blank query', () => {
    expect(filterTasksBySearch([baseTask], '   ')).toEqual([])
  })

  it('getSearchMatchMeta prefers non-title fields when title does not match', () => {
    expect(getSearchMatchMeta(baseTask, 'meter')?.field).toBe('subtask')
    expect(getSearchMatchMeta(baseTask, 'landlord')?.field).toBe('comment')
  })
})
