import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const taskDetailSource = readFileSync(
  path.join(process.cwd(), 'src/features/tasks/components/TaskDetail.tsx'),
  'utf8',
)

describe('TaskDetail metadata rendering', () => {
  it('does not render a raw zero when a task has no focus time', () => {
    expect(taskDetailSource).toContain(
      'Boolean(task.totalFocusTime && task.totalFocusTime > 0) && (',
    )
  })
})
