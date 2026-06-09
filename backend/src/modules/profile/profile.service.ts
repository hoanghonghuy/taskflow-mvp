import { prisma } from '../../lib/prisma'
import { parseJsonArray } from '../../lib/json'

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function dateOnlyFromDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function getLongestHabitCompletionStreak(
  habits: Array<{ completions: string }>,
): number {
  const dates = new Set<string>()

  for (const habit of habits) {
    const completions = parseJsonArray<string>(habit.completions)
    for (const completion of completions) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(completion)) {
        dates.add(completion)
      }
    }
  }

  if (dates.size === 0) return 0

  const ordered = [...dates].sort()
  let best = 1
  let current = 1

  for (let i = 1; i < ordered.length; i++) {
    const prev = new Date(ordered[i - 1] + 'T00:00:00Z')
    const curr = new Date(ordered[i] + 'T00:00:00Z')
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000)

    if (diffDays === 1) {
      current++
      if (current > best) best = current
    } else if (diffDays > 1) {
      current = 1
    }
  }

  return best
}

export function getUnlockedAchievementIds(
  totalTasks: number,
  completedTasks: number,
  habits: Array<{ completions: string }>,
  focusSessions: Array<{ durationSeconds: number }>,
): string[] {
  const result: string[] = []

  if (totalTasks >= 1) result.push('first-task')
  if (completedTasks >= 10) result.push('complete-10')
  if (completedTasks >= 50) result.push('complete-50')

  if (getLongestHabitCompletionStreak(habits) >= 7) {
    result.push('habit-7-day-streak')
  }

  const totalFocusSeconds = focusSessions.reduce((sum, s) => sum + s.durationSeconds, 0)
  if (totalFocusSeconds >= 3600) result.push('focus-1h')

  return result
}

export async function getProfileSummary(userId: string) {
  const [tasks, habits, sessions] = await Promise.all([
    prisma.todoTask.findMany({ where: { userId } }),
    prisma.habit.findMany({ where: { userId } }),
    prisma.pomodoroSession.findMany({ where: { userId } }),
  ])

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.completed).length
  const today = todayUtc()
  const completedHabitsToday = habits.filter((h) =>
    parseJsonArray<string>(h.completions).includes(today),
  ).length

  const pendingWithDueDate = tasks.filter((t) => !t.completed && t.dueDate)
  const todayTasksPending = pendingWithDueDate.filter((t) => {
    const due = dateOnlyFromDate(t.dueDate!)
    return due <= today
  }).length

  const upcomingTasksPending = pendingWithDueDate.filter((t) => {
    const due = dateOnlyFromDate(t.dueDate!)
    return due > today
  }).length

  const focusSessions = sessions.filter((s) => s.type.toLowerCase() === 'focus')
  const totalFocusTime = focusSessions.reduce((sum, s) => sum + s.durationSeconds, 0)
  const totalPomos = focusSessions.length

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks * 100) / totalTasks) : 0

  const unlockedIds = getUnlockedAchievementIds(
    totalTasks,
    completedTasks,
    habits,
    focusSessions,
  )

  return {
    totalTasks,
    completedTasks,
    completionRate,
    totalHabits: habits.length,
    completedHabitsToday,
    totalFocusTime,
    totalPomos,
    unlockedAchievements: unlockedIds.length,
    todayTasksPending,
    upcomingTasksPending,
  }
}

export async function getAchievements(userId: string): Promise<string[]> {
  const [tasks, habits, sessions] = await Promise.all([
    prisma.todoTask.findMany({ where: { userId } }),
    prisma.habit.findMany({ where: { userId } }),
    prisma.pomodoroSession.findMany({ where: { userId } }),
  ])

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.completed).length
  const focusSessions = sessions
    .filter((s) => s.type.toLowerCase() === 'focus')
    .map((s) => ({ durationSeconds: s.durationSeconds }))

  return getUnlockedAchievementIds(totalTasks, completedTasks, habits, focusSessions)
}
