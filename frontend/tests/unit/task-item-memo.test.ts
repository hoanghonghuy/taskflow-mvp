import { describe, expect, it } from 'vitest'
import TaskItem from '@/features/tasks/components/TaskItem'

describe('TaskItem', () => {
  it('is memoized so it does not re-render on unrelated state changes', () => {
    // React.memo wraps the component with a $$typeof tag of react.memo.
    expect(TaskItem.$$typeof).toBe(Symbol.for('react.memo'))
  })
})
