import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import type { MouseEventHandler, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ConfirmationProvider,
  useConfirmation,
} from '@/components/providers/confirmation-provider'

type DialogProps = {
  children?: ReactNode
  open?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
}

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: DialogProps) => (open ? <div>{children}</div> : null),
  AlertDialogContent: ({ children }: DialogProps) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: DialogProps) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: DialogProps) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: DialogProps) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: DialogProps) => <div>{children}</div>,
  AlertDialogCancel: ({ children, onClick }: DialogProps) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogAction: ({ children, onClick }: DialogProps) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}))

function ConfirmTester() {
  const { confirm } = useConfirmation()

  return (
    <button
      type="button"
      onClick={async () => {
        const accepted = await confirm({
          title: 'Delete task?',
          description: 'This cannot be undone.',
          confirmText: 'Delete',
          cancelText: 'Keep',
        })
        document.body.dataset.confirmed = String(accepted)
      }}
    >
      Ask
    </button>
  )
}

describe('ConfirmationProvider', () => {
  beforeEach(() => {
    delete document.body.dataset.confirmed
  })

  it('throws when useConfirmation is used outside provider', () => {
    expect(() => renderHook(() => useConfirmation())).toThrow(
      'useConfirmation must be used within ConfirmationProvider'
    )
  })

  it('resolves true when user confirms', async () => {
    render(
      <ConfirmationProvider>
        <ConfirmTester />
      </ConfirmationProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ask' }))

    expect(await screen.findByText('Delete task?')).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(document.body.dataset.confirmed).toBe('true')
    })
  })

  it('resolves false when user cancels', async () => {
    render(
      <ConfirmationProvider>
        <ConfirmTester />
      </ConfirmationProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ask' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Keep' }))

    await waitFor(() => {
      expect(document.body.dataset.confirmed).toBe('false')
    })
  })
})
