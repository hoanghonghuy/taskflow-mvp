'use client'

import { useEffect, useState } from 'react'

/** True only after the component has mounted on the client (safe for locale/theme from localStorage). */
export function useClientMounted(): boolean {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}
