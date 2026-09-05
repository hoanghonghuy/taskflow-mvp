import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const src = (relativePath: string) =>
  readFileSync(path.join(process.cwd(), 'src', relativePath), 'utf8')

describe('task detail interaction contracts', () => {
  it('opens or focuses date inputs directly from task detail fields', () => {
    const taskDetail = src('features/tasks/components/TaskDetail.tsx')
    expect(taskDetail).toContain('const focusDateInput = (input: HTMLInputElement | null) => {')
    expect(taskDetail).toContain('input.showPicker?.()')
    expect(taskDetail).toContain('onClick={() => focusDateInput(dueDateInputRef.current)}')
    expect(taskDetail).toContain('ref={dueDateInputRef}')
  })
})
