import { describe, expect, it } from 'vitest'
import { resolvePageSkeletonVariant } from '@/components/layout/page-skeleton'

describe('resolvePageSkeletonVariant', () => {
  it('maps known routes', () => {
    expect(resolvePageSkeletonVariant('/')).toBe('dashboard')
    expect(resolvePageSkeletonVariant('/dashboard')).toBe('dashboard')
    expect(resolvePageSkeletonVariant('/list')).toBe('list')
    expect(resolvePageSkeletonVariant('/board')).toBe('board')
    expect(resolvePageSkeletonVariant('/calendar')).toBe('calendar')
    expect(resolvePageSkeletonVariant('/matrix')).toBe('matrix')
    expect(resolvePageSkeletonVariant('/habits')).toBe('habits')
    expect(resolvePageSkeletonVariant('/pomodoro')).toBe('pomodoro')
    expect(resolvePageSkeletonVariant('/countdown')).toBe('countdown')
    expect(resolvePageSkeletonVariant('/settings')).toBe('settings')
    expect(resolvePageSkeletonVariant('/profile')).toBe('profile')
    expect(resolvePageSkeletonVariant('/achievements')).toBe('achievements')
  })

  it('falls back to default for unknown paths', () => {
    expect(resolvePageSkeletonVariant(null)).toBe('dashboard')
    expect(resolvePageSkeletonVariant('/unknown-feature')).toBe('default')
  })
})
