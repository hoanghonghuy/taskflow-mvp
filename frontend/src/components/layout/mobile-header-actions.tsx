'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type MobileHeaderActionsProps = {
  children: ReactNode
}

/** Renders route-specific controls into the shared mobile app header. */
export function MobileHeaderActions({ children }: MobileHeaderActionsProps) {
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )
  const target = isClient ? document.getElementById('mobile-header-actions') : null

  return target ? createPortal(children, target) : null
}
