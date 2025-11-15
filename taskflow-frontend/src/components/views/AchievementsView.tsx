'use client'

import React from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/constants'

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
    <div className="flex-1 flex flex-col overflow-y-auto">
      <header className="p-6 border-b border-border flex-shrink-0">
        <h1 className="text-3xl font-bold">{t('nav.achievements')}</h1>
        <p className="text-muted-foreground">Your achievements and badges</p>
      </header>
      <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAchievements.map(achievement => {
            const isUnlocked = unlockedSet.has(achievement.id)
            const isCompleted = achievement.condition(state)

            return (
              <div
                key={achievement.id}
                className={`
                  bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center
                  transition-all duration-300
                  ${isUnlocked ? 'opacity-100 shadow-md' : 'opacity-50 filter grayscale'}
                `}
                title={isUnlocked ? achievement.description : (t('achievements.locked.description') || 'Locked')}
              >
                <div className={`
                  p-4 rounded-full mb-4 text-4xl
                  ${isUnlocked ? 'bg-primary/10' : 'bg-secondary'}
                `}>
                  {achievement.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{achievement.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                {!isUnlocked && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('achievements.locked.status') || 'Locked'}
                  </p>
                )}
                {isCompleted && !isUnlocked && (
                  <p className="text-xs text-primary mt-2 font-semibold">
                    {t('achievements.ready') || 'Ready to unlock!'}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default AchievementsView

