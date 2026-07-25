import { prisma } from '../../src/lib/prisma'
import {
  getPomodoroState,
  updatePomodoroState,
} from '../../src/services/pomodoroService'
import { resetDatabase } from '../helpers'

describe('pomodoro.service', () => {
  let userId: string

  beforeEach(async () => {
    await resetDatabase()
    const user = await prisma.user.create({
      data: { name: 'P', email: 'pomo@test.com', passwordHash: 'h' },
    })
    userId = user.id
  })

  it('returns null when no state', async () => {
    expect(await getPomodoroState(userId)).toBeNull()
  })

  it('returns null for invalid stored JSON', async () => {
    await prisma.userSettings.create({
      data: {
        userId,
        pomodoroStateJson: 'not-json',
        pomodoroStateUpdatedAt: new Date(),
      },
    })
    expect(await getPomodoroState(userId)).toBeNull()
  })

  it('adjusts remaining time when active and elapsed', async () => {
    const twoMinutesAgo = new Date(Date.now() - 120_000)
    await prisma.userSettings.create({
      data: {
        userId,
        pomodoroStateJson: JSON.stringify({
          isActive: true,
          isPaused: false,
          remainingSeconds: 300,
          currentSession: 'focus',
          focusedTaskId: null,
          focusedHabitId: null,
          sessionsCompleted: 0,
        }),
        pomodoroStateUpdatedAt: twoMinutesAgo,
      },
    })

    const state = await getPomodoroState(userId)
    expect(state!.remainingSeconds).toBeLessThan(300)
  })

  it('zeros timer when elapsed exceeds remaining', async () => {
    const longAgo = new Date(Date.now() - 600_000)
    await prisma.userSettings.create({
      data: {
        userId,
        pomodoroStateJson: JSON.stringify({
          isActive: true,
          isPaused: false,
          remainingSeconds: 10,
          currentSession: 'focus',
          focusedTaskId: null,
          focusedHabitId: null,
          sessionsCompleted: 0,
        }),
        pomodoroStateUpdatedAt: longAgo,
      },
    })

    const state = await getPomodoroState(userId)
    expect(state!.remainingSeconds).toBe(0)
    expect(state!.isActive).toBe(false)
  })

  it('updatePomodoroState persists when user has no settings row yet', async () => {
    await updatePomodoroState(userId, {
      isActive: true,
      isPaused: false,
      remainingSeconds: 1500,
      currentSession: 'focus',
      sessionsCompleted: 0,
    })

    const loaded = await getPomodoroState(userId)
    expect(loaded).not.toBeNull()
    expect(loaded!.remainingSeconds).toBe(1500)
    expect(loaded!.isActive).toBe(true)
  })

  it('updatePomodoroState normalizes negative values', async () => {
    const state = await updatePomodoroState(userId, {
      isActive: false,
      isPaused: false,
      remainingSeconds: -5,
      currentSession: '',
      focusedTaskId: '  ',
      focusedHabitId: '  ',
      sessionsCompleted: -1,
    })
    expect(state.remainingSeconds).toBe(0)
    expect(state.currentSession).toBe('focus')
    expect(state.sessionsCompleted).toBe(0)
  })

  it('concurrent getPomodoroState while active elapsed rejects the loser with ConcurrentUpdateError', async () => {
    const twoMinutesAgo = new Date(Date.now() - 120_000)
    await prisma.userSettings.create({
      data: {
        userId,
        pomodoroStateJson: JSON.stringify({
          isActive: true,
          isPaused: false,
          remainingSeconds: 300,
          currentSession: 'focus',
          focusedTaskId: null,
          focusedHabitId: null,
          sessionsCompleted: 0,
        }),
        pomodoroStateUpdatedAt: twoMinutesAgo,
      },
    })

    const results = await Promise.allSettled([
      getPomodoroState(userId),
      getPomodoroState(userId),
    ])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')
    expect(fulfilled.length).toBeGreaterThanOrEqual(1)
    expect(rejected).toHaveLength(1)
    expect((rejected[0] as PromiseRejectedResult).reason.name).toBe('ConcurrentUpdateError')
  })

  it('updatePomodoroState rejects a concurrent stale write', async () => {
    const first = await updatePomodoroState(userId, {
      isActive: true,
      isPaused: false,
      remainingSeconds: 1500,
      currentSession: 'focus',
      sessionsCompleted: 0,
      expectedUpdatedAt: null,
    })
    expect(first.updatedAt).toBeTruthy()

    const results = await Promise.allSettled([
      updatePomodoroState(userId, {
        isActive: true,
        isPaused: false,
        remainingSeconds: 100,
        currentSession: 'focus',
        sessionsCompleted: 1,
        expectedUpdatedAt: first.updatedAt,
      }),
      updatePomodoroState(userId, {
        isActive: true,
        isPaused: false,
        remainingSeconds: 50,
        currentSession: 'focus',
        sessionsCompleted: 2,
        expectedUpdatedAt: first.updatedAt,
      }),
    ])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    expect((rejected[0] as PromiseRejectedResult).reason.name).toBe('ConcurrentUpdateError')
  })
})
