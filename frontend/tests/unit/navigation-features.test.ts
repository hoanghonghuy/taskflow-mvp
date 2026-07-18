import { describe, expect, it } from 'vitest'
import { getPathForView, getViewFromPathname } from '@/lib/navigation/features'

describe('navigation features', () => {
  it('maps views to paths', () => {
    expect(getPathForView('dashboard')).toBe('/dashboard')
    expect(getPathForView('habit')).toBe('/habits')
    expect(getPathForView('list')).toBe('/list')
  })

  it('maps pathnames to views', () => {
    expect(getViewFromPathname('/')).toBe('dashboard')
    expect(getViewFromPathname('/dashboard')).toBe('dashboard')
    expect(getViewFromPathname('/habits')).toBe('habit')
    expect(getViewFromPathname('/matrix')).toBe('matrix')
  })
})
