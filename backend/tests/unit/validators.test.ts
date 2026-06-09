import { ZodError } from 'zod'
import { createTaskSchema, updateTaskSchema } from '../../src/validators/task.validator'
import { loginSchema, registerSchema } from '../../src/validators/auth.validator'
import { completeHabitSchema } from '../../src/validators/habit.validator'

describe('validators', () => {
  it('createTaskSchema rejects empty title', () => {
    expect(() => createTaskSchema.parse({ title: '   ', listId: 'inbox' })).toThrow(ZodError)
  })

  it('createTaskSchema accepts valid payload with or without listId', () => {
    const withList = createTaskSchema.parse({
      title: 'Task A',
      listId: 'inbox',
      priority: 'high',
      tags: ['work'],
    })
    expect(withList.title).toBe('Task A')
    expect(withList.priority).toBe('high')

    const withoutList = createTaskSchema.parse({ title: 'Task B' })
    expect(withoutList.listId).toBeUndefined()
  })

  it('updateTaskSchema allows partial updates', () => {
    const parsed = updateTaskSchema.parse({ completed: true })
    expect(parsed.completed).toBe(true)
  })

  it('registerSchema enforces password length', () => {
    expect(() =>
      registerSchema.parse({ name: 'A', email: 'a@test.com', password: 'short' }),
    ).toThrow(ZodError)
  })

  it('loginSchema requires email format', () => {
    expect(() => loginSchema.parse({ email: 'bad', password: 'x' })).toThrow(ZodError)
  })

  it('completeHabitSchema validates optional date', () => {
    expect(completeHabitSchema.parse({ date: '2026-06-09' }).date).toBe('2026-06-09')
    expect(() => completeHabitSchema.parse({ date: '06-09-2026' })).toThrow(ZodError)
  })
})
