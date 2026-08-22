'use client'

import React from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements'
import { achievementDescriptionKey, achievementTitleKey } from '@/lib/achievements-i18n'
import { AppPage, AppPageMain } from '@/components/layout/app-page'
import { AppPageHeader } from '@/components/layout/app-page-header'
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Flame,
  Star,
  Target,
} from 'lucide-react'
import type { AppState } from '@/types'

const ACHIEVEMENT_ICONS = {
  'first-task': Target,
  'complete-10': Star,
  'complete-50': CheckCircle2,
  'week-streak': Flame,
  'habit-7-day-streak': CalendarCheck2,
  'focus-1h': Clock3,
} as const

function achievementProgress(id: string, state: AppState) {
  const completedTasks = state.tasks.filter((task) => task.completed).length

  switch (id) {
    case 'first-task':
      return { current: Math.min(state.tasks.length, 1), target: 1 }
    case 'complete-10':
      return { current: Math.min(completedTasks, 10), target: 10 }
    case 'complete-50':
      return { current: Math.min(completedTasks, 50), target: 50 }
    case 'focus-1h': {
      const focusedSeconds = state.pomodoro.focusHistory.reduce(
        (total, session) => total + session.duration,
        0,
      )
      return { current: Math.min(Math.floor(focusedSeconds / 60), 60), target: 60 }
    }
    default:
      return null
  }
}

const AchievementsView: React.FC = () => {
  const { state } = useTaskManager()
  const { t } = useI18n()

  const unlockedSet = new Set(state.unlockedAchievements || [])
  const sortedAchievements = [...ACHIEVEMENT_DEFINITIONS].sort((a, b) => {
    const aUnlocked = unlockedSet.has(a.id)
    const bUnlocked = unlockedSet.has(b.id)
    if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1
    const aCompleted = a.condition(state)
    const bCompleted = b.condition(state)
    if (aCompleted !== bCompleted) return aCompleted ? -1 : 1
    return 0
  })

  const unlockedCount = sortedAchievements.filter((achievement) =>
    unlockedSet.has(achievement.id),
  ).length
  const completionPercent =
    sortedAchievements.length > 0
      ? Math.round((unlockedCount / sortedAchievements.length) * 100)
      : 0

  return (
    <AppPage>
      <AppPageHeader
        title={t('nav.achievements')}
        subtitle={t('achievements.subtitle')}
        hideOnMobile={false}
      />

      <AppPageMain className="space-y-5 py-4 md:space-y-6 md:py-6">
        <section className="rounded-xl border border-border/70 bg-card p-4 sm:p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {t('achievement.progress')}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {unlockedCount}/{sortedAchievements.length}
              </p>
            </div>
            <span className="text-sm font-medium text-muted-foreground tabular-nums">
              {completionPercent}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedAchievements.map((achievement) => {
            const isUnlocked = unlockedSet.has(achievement.id)
            const isCompleted = achievement.condition(state)
            const title = t(achievementTitleKey(achievement.id))
            const description = t(achievementDescriptionKey(achievement.id))
            const progress = achievementProgress(achievement.id, state)
            const progressPercent = progress
              ? Math.round((progress.current / progress.target) * 100)
              : isCompleted
                ? 100
                : 0
            const Icon =
              ACHIEVEMENT_ICONS[achievement.id as keyof typeof ACHIEVEMENT_ICONS] ?? Target

            return (
              <article
                key={achievement.id}
                className={`relative overflow-hidden rounded-xl border bg-card p-5 transition-[border-color,box-shadow,opacity] duration-150 motion-reduce:transition-none ${
                  isUnlocked
                    ? 'border-primary/30 shadow-sm'
                    : isCompleted
                      ? 'border-primary/20'
                      : 'border-border/70'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      isUnlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-foreground">{title}</h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                          isUnlocked
                            ? 'bg-primary/10 text-primary'
                            : isCompleted
                              ? 'bg-primary/5 text-primary'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isUnlocked
                          ? t('achievement.earned')
                          : isCompleted
                            ? t('achievements.ready')
                            : t('achievements.locked.status')}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{description}</p>
                  </div>
                </div>

                {!isUnlocked && (
                  <div className="mt-5 border-t border-border/50 pt-4">
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>{t('achievement.progress')}</span>
                      {progress ? (
                        <span className="tabular-nums">
                          {progress.current}/{progress.target}
                        </span>
                      ) : (
                        <span>{progressPercent}%</span>
                      )}
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </section>
      </AppPageMain>
    </AppPage>
  )
}

export default AchievementsView
