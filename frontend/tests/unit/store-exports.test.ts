import { describe, expect, it } from 'vitest'
import { INITIAL_STATE } from '@/lib/store/task-manager/initial-state'
import * as actions from '@/lib/store/task-manager/actions'
import { DEFAULT_POMODORO_SETTINGS } from '@/lib/task-constants'
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements'

describe('store exports', () => {
  it('INITIAL_STATE has expected shape', () => {
    expect(INITIAL_STATE.view).toBe('dashboard')
    expect(INITIAL_STATE.pomodoro.settings).toEqual(DEFAULT_POMODORO_SETTINGS)
  })

  it('actions are defined', () => {
    expect(actions.taskActions).toBeDefined()
    expect(actions.listActions).toBeDefined()
  })

  it('achievements re-export', () => {
    expect(ACHIEVEMENT_DEFINITIONS.length).toBeGreaterThan(0)
  })
})
