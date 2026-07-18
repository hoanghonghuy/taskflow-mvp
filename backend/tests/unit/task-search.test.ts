import { taskMatchesUserFacingSearch } from '../../src/lib/task-search'

describe('taskMatchesUserFacingSearch', () => {
  it('matches title/description/tags/subtask/comment text', () => {
    const task = {
      title: 'Bill',
      description: 'Monthly utilities',
      tags: ['finance'],
      subtasks: [{ title: 'Check meter' }],
      comments: [{ content: 'Ask landlord' }],
    }
    expect(taskMatchesUserFacingSearch(task, 'bill')).toBe(true)
    expect(taskMatchesUserFacingSearch(task, 'utilities')).toBe(true)
    expect(taskMatchesUserFacingSearch(task, 'finance')).toBe(true)
    expect(taskMatchesUserFacingSearch(task, 'meter')).toBe(true)
    expect(taskMatchesUserFacingSearch(task, 'landlord')).toBe(true)
  })

  it('does not match JSON metadata keys', () => {
    const task = {
      title: 'Plain',
      description: '',
      tags: [],
      subtasks: [{ id: 's1', title: 'Real title', completed: false }],
      comments: [{ id: 'c1', userId: 'u1', content: 'Real content', timestamp: 't' }],
    }
    expect(taskMatchesUserFacingSearch(task, 'completed')).toBe(false)
    expect(taskMatchesUserFacingSearch(task, 'userId')).toBe(false)
    expect(taskMatchesUserFacingSearch(task, 's1')).toBe(false)
  })
})
