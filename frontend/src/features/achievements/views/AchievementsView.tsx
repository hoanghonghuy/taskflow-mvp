'use client'

import React from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements'
import { achievementDescriptionKey, achievementTitleKey } from '@/lib/achievements-i18n'
import { AppPage, AppPageMain } from '@/components/layout/app-page'
import { AppPageHeader } from '@/components/layout/app-page-header'

const AchievementsView: React.FC = () => {
  const { state } = useTaskManager()
  const { t } = useI18n()

  const unlockedSet = new Set(state.unlockedAchievements || [])
  const sortedAchievements = [...ACHIEVEMENT_DEFINITIONS].sort((a, b) => {
    const aUnlocked = unlockedSet.has(a.id)
    const bUnlocked = unlockedSet.has(b.id)
    if (aUnlocked && !bUnlocked) return -1
    if (!aUnlocked && bUnlocked) return 1
    return 0
  })

  return (
    <AppPage>
      <AppPageHeader
        title={t('nav.achievements')}
        subtitle={t('achievements.subtitle')}
      />
      <AppPageMain className="py-4 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAchievements.map(achievement => {
            const isUnlocked = unlockedSet.has(achievement.id)
            const isCompleted = achievement.condition(state)
            const title = t(achievementTitleKey(achievement.id))
            const description = t(achievementDescriptionKey(achievement.id))

            return (
              <div
                key={achievement.id}
                className={`
                  bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center
                  transition-[opacity,filter,box-shadow] duration-200
                  ${isUnlocked ? 'opacity-100 shadow-md' : 'opacity-50 filter grayscale'}
                `}
                title={isUnlocked ? description : t('achievements.locked.description')}
              >
                <div className={`
                  p-4 rounded-full mb-4 text-4xl
                  ${isUnlocked ? 'bg-primary/10' : 'bg-secondary'}
                `}>
                  {achievement.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{description}</p>
                {!isUnlocked && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('achievements.locked.status')}
                  </p>
                )}
                {isCompleted && !isUnlocked && (
                  <p className="text-xs text-primary mt-2 font-semibold">
                    {t('achievements.ready')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </AppPageMain>
    </AppPage>
  )
}

export default AchievementsView
