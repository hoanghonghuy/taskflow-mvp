import type { TodoList } from '@prisma/client'
import {
  isListAccessible,
  isListOwner,
  membersContainUserId,
  parseListMembers,
} from '../../src/lib/list-access'

describe('list-access', () => {
  const ownerId = 'owner-uuid'
  const memberId = 'member-uuid'

  const sharedList = {
    id: 'list-1',
    userId: ownerId,
    members: JSON.stringify([memberId]),
  } as TodoList

  it('parseListMembers reads JSON array', () => {
    expect(parseListMembers('["a","b"]')).toEqual(['a', 'b'])
  })

  it('isListOwner and isListAccessible', () => {
    expect(isListOwner(sharedList, ownerId)).toBe(true)
    expect(isListOwner(sharedList, memberId)).toBe(false)
    expect(isListAccessible(sharedList, memberId)).toBe(true)
    expect(isListAccessible(sharedList, 'stranger')).toBe(false)
  })

  it('membersContainUserId builds prisma contains filter', () => {
    expect(membersContainUserId(memberId)).toEqual({ contains: `"${memberId}"` })
  })
})
