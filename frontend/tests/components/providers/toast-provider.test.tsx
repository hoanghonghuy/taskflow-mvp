import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast } from '@/components/providers/toast-provider'

const {
  sonnerToast,
  sonnerSuccess,
  sonnerError,
  sonnerInfo,
  sonnerPromise,
} = vi.hoisted(() => ({
  sonnerToast: vi.fn(),
  sonnerSuccess: vi.fn(),
  sonnerError: vi.fn(),
  sonnerInfo: vi.fn(),
  sonnerPromise: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: Object.assign(sonnerToast, {
    success: sonnerSuccess,
    error: sonnerError,
    info: sonnerInfo,
    promise: sonnerPromise,
  }),
}))

function ToastTestWrapper({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when useToast is used outside provider', () => {
    expect(() => renderHook(() => useToast())).toThrow(
      'useToast must be used within ToastProvider'
    )
  })

  it('shows default toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastTestWrapper })

    act(() => {
      result.current.toast({ title: 'Hello', description: 'World' })
    })

    expect(sonnerToast).toHaveBeenCalledWith('Hello', {
      description: 'World',
      duration: undefined,
    })
  })

  it('shows destructive toast as error', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastTestWrapper })

    act(() => {
      result.current.toast({ title: 'Oops', variant: 'destructive' })
    })

    expect(sonnerError).toHaveBeenCalledWith('Oops', {
      description: undefined,
      duration: undefined,
    })
  })

  it('shows success toast variant', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastTestWrapper })

    act(() => {
      result.current.toast({ title: 'Done', variant: 'success' })
    })

    expect(sonnerSuccess).toHaveBeenCalledWith('Done', {
      description: undefined,
      duration: undefined,
    })
  })

  it('exposes shortcut helpers', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastTestWrapper })

    act(() => {
      result.current.success('Saved')
      result.current.error('Failed')
      result.current.info('Note')
    })

    expect(sonnerSuccess).toHaveBeenCalledWith('Saved', { description: undefined })
    expect(sonnerError).toHaveBeenCalledWith('Failed', { description: undefined })
    expect(sonnerInfo).toHaveBeenCalledWith('Note', { description: undefined })
  })

  it('delegates promise to sonner', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastTestWrapper })
    const promise = Promise.resolve('ok')

    act(() => {
      result.current.promise(promise, {
        loading: 'Loading',
        success: 'Done',
        error: 'Error',
      })
    })

    expect(sonnerPromise).toHaveBeenCalledWith(promise, {
      loading: 'Loading',
      success: 'Done',
      error: 'Error',
    })
  })
})
