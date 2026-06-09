/**
 * Utility to clear localStorage and reload mock data
 * Use this in development to reset the app state
 */
export function clearTaskflowStorage() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('taskflowState')
    console.log('✅ Cleared taskflowState from localStorage')
    console.log('🔄 Reload the page to see mock data')
  }
}

/**
 * Check if localStorage has empty state
 */
export function hasEmptyState(): boolean {
  if (typeof window === 'undefined') return false
  const saved = localStorage.getItem('taskflowState')
  if (!saved) return true
  try {
    const parsed = JSON.parse(saved)
    return !parsed.tasks || parsed.tasks.length === 0
  } catch {
    return true
  }
}

