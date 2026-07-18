import { describe, expect, it } from 'vitest'
import { arrayMove, moveItemById } from '@/lib/utils/array-move'

describe('arrayMove', () => {
  it('moves an item down (higher index) without undoing the move', () => {
    expect(arrayMove(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c'])
    expect(arrayMove(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
  })

  it('moves an item up (lower index)', () => {
    expect(arrayMove(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
    expect(arrayMove(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'c', 'b'])
  })
})

describe('moveItemById', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

  it('reorders when dragging down onto a lower item', () => {
    expect(moveItemById(items, 'a', 'b').map((i) => i.id)).toEqual(['b', 'a', 'c'])
    expect(moveItemById(items, 'a', 'c').map((i) => i.id)).toEqual(['b', 'c', 'a'])
  })

  it('reorders when dragging up onto a higher item', () => {
    expect(moveItemById(items, 'c', 'a').map((i) => i.id)).toEqual(['c', 'a', 'b'])
  })
})
