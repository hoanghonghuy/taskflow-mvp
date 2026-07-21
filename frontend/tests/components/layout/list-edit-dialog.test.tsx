import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ListEditDialog } from '@/components/layout/list-edit-dialog'
import { I18nProvider } from '@/components/providers/i18n-provider'

const mocks = vi.hoisted(() => ({
  updateList: vi.fn(),
  success: vi.fn(),
}))

vi.mock('@/components/providers/task-manager-provider', () => ({
  useListActions: () => ({ updateList: mocks.updateList }),
}))

vi.mock('@/components/providers/toast-provider', () => ({
  useToast: () => ({ success: mocks.success }),
}))

describe('ListEditDialog', () => {
  it('stays open and does not toast success when update fails', async () => {
    mocks.updateList.mockResolvedValue(false)
    const onOpenChange = vi.fn()

    render(
      <I18nProvider initialLocale="en">
        <ListEditDialog
          open
          onOpenChange={onOpenChange}
          list={{ id: 'list-1', name: 'Work', color: '#6b7280', members: [] }}
        />
      </I18nProvider>,
    )

    await userEvent.setup().click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(mocks.updateList).toHaveBeenCalled())
    expect(mocks.success).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
