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

const inertElements = new Map<HTMLElement, { count: number; wasInert: boolean }>()
let scrollLockCount = 0
let previousBodyOverflow = ''

function acquireModalIsolation(surface: HTMLElement): () => void {
  const acquired: HTMLElement[] = []
  let activeElement: HTMLElement = surface

  while (activeElement.parentElement) {
    const parent = activeElement.parentElement
    for (const sibling of parent.children) {
      if (sibling === activeElement || !(sibling instanceof HTMLElement)) continue
      const current = inertElements.get(sibling)
      if (current) {
        current.count += 1
      } else {
        inertElements.set(sibling, {
          count: 1,
          wasInert: sibling.hasAttribute('inert'),
        })
        sibling.setAttribute('inert', '')
      }
      acquired.push(sibling)
    }
    if (parent === document.body) break
    activeElement = parent
  }

  if (scrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  scrollLockCount += 1

  return () => {
    for (const element of acquired) {
      const current = inertElements.get(element)
      if (!current) continue
      current.count -= 1
      if (current.count === 0) {
        if (!current.wasInert) element.removeAttribute('inert')
        inertElements.delete(element)
      }
    }

    scrollLockCount = Math.max(0, scrollLockCount - 1)
    if (scrollLockCount === 0) {
      document.body.style.overflow = previousBodyOverflow
    }
  }
}

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
    if (!surface) return
    const releaseModalIsolation = acquireModalIsolation(surface)
    const firstFocusable = surface?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(firstFocusable ?? surface)?.focus()

    return () => {
      releaseModalIsolation()
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
