'use client'

import React from 'react';
import { Achievement } from '../../types';
import { useTranslation } from '../../hooks/useI18n';

interface AchievementBadgeProps {
    achievement: Achievement;
    isUnlocked: boolean;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement, isUnlocked }) => {
    const { t } = useTranslation();
    const Icon = achievement.icon;

    return (
        <div 
            className={`
                bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center
                transition-all duration-300
                ${isUnlocked ? 'opacity-100 shadow-md' : 'opacity-50 filter grayscale'}
            `}
            title={isUnlocked ? t(achievement.description) : t('achievements.locked.description')}
        >
            <div className={`
                p-4 rounded-full mb-4
                ${isUnlocked ? 'bg-primary/10 text-primary' : 'bg-secondary'}
            `}>
                <Icon className="h-10 w-10" />
            </div>
            <h3 className="font-bold">{t(achievement.title)}</h3>
            {!isUnlocked && <p className="text-xs text-muted-foreground mt-1">{t('achievements.locked.status')}</p>}
        </div>
    );
};

export default AchievementBadge;
