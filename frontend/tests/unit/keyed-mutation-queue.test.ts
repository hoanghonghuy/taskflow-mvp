import { describe, expect, it } from 'vitest'

import {
  createKeyedMutationQueue,
  scopedMutationKey,
} from '@/lib/utils/keyed-mutation-queue'

describe('createKeyedMutationQueue', () => {
  it('isolates identical entity ids between users', () => {
    expect(scopedMutationKey('user-a', 'task-1')).not.toBe(
      scopedMutationKey('user-b', 'task-1'),
    )
  })

  it('serializes mutations for the same entity while allowing other entities', async () => {
    const queue = createKeyedMutationQueue()
    const events: string[] = []
    let releaseFirst!: () => void
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })

    const first = queue.run('task-1', async () => {
      events.push('first:start')
      await firstGate
      events.push('first:end')
    })
    const second = queue.run('task-1', async () => {
      events.push('second:start')
    })
    const other = queue.run('task-2', async () => {
      events.push('other:start')
    })

    await other
    expect(events).toEqual(['first:start', 'other:start'])

    releaseFirst()
    await Promise.all([first, second])
    expect(events).toEqual(['first:start', 'other:start', 'first:end', 'second:start'])
  })

  it('continues the queue after an earlier mutation fails', async () => {
    const queue = createKeyedMutationQueue()

    await expect(
      queue.run('task-1', async () => {
        throw new Error('failed')
      }),
    ).rejects.toThrow('failed')

    await expect(queue.run('task-1', async () => 'saved')).resolves.toBe('saved')
  })
})
