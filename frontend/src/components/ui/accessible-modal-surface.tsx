'use client'

import { useEffect, useRef, type ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

type AccessibleModalSurfaceProps = ComponentProps<'div'> & {
  onClose: () => void
}

export function AccessibleModalSurface({
  children,
  className,
  onClose,
  ...props
}: AccessibleModalSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const surface = surfaceRef.current
    const firstFocusable = surface?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(firstFocusable ?? surface)?.focus()

    return () => {
      previousFocus?.focus()
    }
  }, [])

  return (
    <div
      ref={surfaceRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className={cn('outline-none', className)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
          return
        }

        if (event.key !== 'Tab') return
        const focusable = [...(surfaceRef.current?.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR,
        ) ?? [])]
        if (focusable.length === 0) {
          event.preventDefault()
          surfaceRef.current?.focus()
          return
        }

        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }}
      {...props}
    >
      {children}
    </div>
  )
}
