'use client'

import React from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { useTranslation } from '../../hooks/useI18n';
import { ALL_ACHIEVEMENTS } from '../../constants';
import AchievementBadge from './AchievementBadge';

const AchievementsView: React.FC = () => {
    const { state } = useTaskManager();
    const { t } = useTranslation();

    const unlockedSet = new Set(state.unlockedAchievements);
    const sortedAchievements = [...ALL_ACHIEVEMENTS].sort((a, b) => {
        const aUnlocked = unlockedSet.has(a.id);
        const bUnlocked = unlockedSet.has(b.id);
        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;
        return 0;
    });

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <header className="p-6 border-b border-border flex-shrink-0">
                <h1 className="text-2xl font-bold">{t('achievements.title')}</h1>
                <p className="text-muted-foreground">{t('achievements.subtitle')}</p>
            </header>
            <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {sortedAchievements.map(achievement => (
                        <AchievementBadge 
                            key={achievement.id}
                            achievement={achievement}
                            isUnlocked={unlockedSet.has(achievement.id)}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
};

export default AchievementsView;
