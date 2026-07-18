import { describe, expect, it } from 'vitest'
import { isOwnedList, isSharedListMember } from '@/lib/utils/list-access'

describe('list-access', () => {
  it('detects shared list member', () => {
    expect(isSharedListMember({ ownerUserId: 'owner-1' }, 'member-1')).toBe(true)
    expect(isSharedListMember({ ownerUserId: 'owner-1' }, 'owner-1')).toBe(false)
    expect(isSharedListMember({ ownerUserId: undefined }, 'u1')).toBe(false)
    expect(isSharedListMember(null, 'u1')).toBe(false)
  })

  it('treats missing owner as owned', () => {
    expect(isOwnedList({ ownerUserId: undefined }, 'u1')).toBe(true)
    expect(isOwnedList({ ownerUserId: 'u1' }, 'u1')).toBe(true)
    expect(isOwnedList({ ownerUserId: 'other' }, 'u1')).toBe(false)
  })
})
