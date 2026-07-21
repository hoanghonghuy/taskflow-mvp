import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AccessibleModalSurface } from '@/components/ui/accessible-modal-surface'

describe('AccessibleModalSurface', () => {
  it('announces a dialog, focuses its content and closes with Escape', async () => {
    const onClose = vi.fn()
    render(
      <AccessibleModalSurface aria-label="Edit task" onClose={onClose}>
        <button type="button">Save</button>
      </AccessibleModalSurface>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Edit task' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus())

    await userEvent.setup().keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })
})
