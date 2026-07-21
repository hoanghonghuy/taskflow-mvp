import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TaskMoveControl } from '@/components/ui/task-move-control'

describe('TaskMoveControl', () => {
  it('moves to a different destination using a touch-friendly select', async () => {
    const onMove = vi.fn()
    render(
      <TaskMoveControl
        label="Move task"
        value="todo"
        options={[
          { value: 'todo', label: 'To do' },
          { value: 'done', label: 'Done' },
        ]}
        onMove={onMove}
      />,
    )

    const select = screen.getByRole('combobox', { name: 'Move task' })
    expect(select).toHaveClass('h-11')

    await userEvent.setup().selectOptions(select, 'done')
    expect(onMove).toHaveBeenCalledWith('done')
  })

  it('does not emit when the current destination is selected', async () => {
    const onMove = vi.fn()
    render(
      <TaskMoveControl
        label="Change priority"
        value="high"
        options={[
          { value: 'high', label: 'High' },
          { value: 'low', label: 'Low' },
        ]}
        onMove={onMove}
      />,
    )

    await userEvent.setup().selectOptions(
      screen.getByRole('combobox', { name: 'Change priority' }),
      'high',
    )
    expect(onMove).not.toHaveBeenCalled()
  })
})
