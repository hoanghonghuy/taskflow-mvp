'use client'

import React, { useMemo, useState } from 'react';
import { useUser } from '../../hooks/useUser';
import { useTaskManager } from '../../hooks/useTaskManager';
import { useTranslation } from '../../hooks/useI18n';
import Avatar from '../ui/Avatar';
import { CheckCircleIcon, StopwatchIcon, TrophyIcon } from '../../constants';
import { ALL_ACHIEVEMENTS } from '../../constants';
import AchievementBadge from '../achievements/AchievementBadge';
import EditProfileModal from './EditProfileModal';
import { useToast } from '../../hooks/useToast';
import { User } from '../../types';

const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-card border border-border rounded-lg p-6 flex items-start gap-4">
        <div className="bg-primary/10 text-primary p-3 rounded-lg">
            {icon}
        </div>
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    </div>
);

const WeeklyActivityChart: React.FC = () => {
    const { state } = useTaskManager();
    const { t } = useTranslation();

    const weeklyData = useMemo(() => {
        const today = new Date();
        const days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - i);
            return d;
        }).reverse();

        const taskCounts = days.map(day => {
            const dayStr = toYYYYMMDD(day);
            const count = state.tasks.filter(t => t.completed && t.completedAt?.startsWith(dayStr)).length;
            return {
                day: day.toLocaleDateString(undefined, { weekday: 'short' }),
                count,
            };
        });
        
        const maxCount = Math.max(1, ...taskCounts.map(d => d.count));

        return taskCounts.map(d => ({ ...d, height: (d.count / maxCount) * 100 }));
    }, [state.tasks]);

    return (
        <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-bold mb-4">{t('profile.weeklyActivity')}</h3>
            <div className="flex justify-between items-end h-32 gap-2">
                {weeklyData.map(({ day, height, count }) => (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="relative w-full h-full flex items-end">
                            <div
                                className="w-full bg-primary/20 rounded-t-md group-hover:bg-primary/40 transition-all"
                                style={{ height: `${height}%` }}
                                title={`${count} ${t('profile.tasksCompleted')}`}
                            ></div>
                        </div>
                        <span className="text-xs text-muted-foreground">{day}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const ProfileView: React.FC = () => {
    const { user, updateUser } = useUser();
    const { state, dispatch } = useTaskManager();
    const { t } = useTranslation();
    const addToast = useToast();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (!user) return null;

    const handleSaveProfile = (updatedData: Partial<User>) => {
        updateUser(updatedData);
        addToast(t('profile.updateSuccess'), 'success');
        setIsEditModalOpen(false);
    };

    const tasksCompleted = state.tasks.filter(t => t.completed).length;
    const totalFocusSeconds = state.pomodoro.focusHistory.reduce((acc, session) => acc + session.duration, 0);
    const totalFocusHours = (totalFocusSeconds / 3600).toFixed(1);
    const achievementsUnlocked = state.unlockedAchievements.length;
    
    const recentActivities = useMemo(() => {
        return state.tasks
            .filter(t => t.completed && t.completedAt)
            .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
            .slice(0, 5);
    }, [state.tasks]);
    
    const recentAchievements = useMemo(() => {
        return state.unlockedAchievements
            .slice(-3)
            .reverse()
            .map(id => ALL_ACHIEVEMENTS.find(ach => ach.id === id))
            .filter((a): a is NonNullable<typeof a> => a !== undefined);
    }, [state.unlockedAchievements]);


    return (
        <>
            <div className="flex-1 flex flex-col overflow-y-auto pb-16 md:pb-0">
                <header className="p-6 border-b border-border bg-card">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <Avatar user={user} className="w-24 h-24 text-4xl" />
                            <div>
                                <h1 className="text-3xl font-bold">{user.name}</h1>
                                <p className="text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-semibold hover:bg-muted"
                        >
                            {t('profile.editProfile')}
                        </button>
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <section>
                            <h2 className="text-xl font-bold mb-4">{t('profile.stats.title')}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <StatCard 
                                    icon={<CheckCircleIcon className="h-6 w-6" />}
                                    label={t('profile.stats.tasksCompleted')}
                                    value={tasksCompleted}
                                />
                                <StatCard 
                                    icon={<StopwatchIcon className="h-6 w-6" />}
                                    label={t('profile.stats.focusTime')}
                                    value={`${totalFocusHours}h`}
                                />
                                <StatCard 
                                    icon={<TrophyIcon className="h-6 w-6" />}
                                    label={t('profile.stats.achievementsUnlocked')}
                                    value={achievementsUnlocked}
                                />
                            </div>
                        </section>
                        <section>
                            <WeeklyActivityChart />
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="bg-card border border-border rounded-lg p-6">
                            <h3 className="font-bold mb-4">{t('profile.recentActivity')}</h3>
                            <div className="space-y-4">
                                {recentActivities.length > 0 ? (
                                    recentActivities.map(task => (
                                        <div key={task.id} className="flex items-center gap-3">
                                            <div className="p-2 bg-green-500/10 rounded-full">
                                                <CheckCircleIcon className="h-4 w-4 text-green-500"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium line-through text-muted-foreground truncate">{task.title}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(task.completedAt!).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">{t('profile.noRecentActivity')}</p>
                                )}
                            </div>
                        </section>
                        <section className="bg-card border border-border rounded-lg p-6">
                            <h3 className="font-bold mb-4">{t('profile.recentAchievements')}</h3>
                            <div>
                                {recentAchievements.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-4">
                                    {recentAchievements.map(ach => (
                                        <div key={ach.id} className="flex flex-col items-center text-center">
                                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                                                <ach.icon className="h-6 w-6" />
                                            </div>
                                            <p className="text-xs mt-1 font-medium">{t(ach.title)}</p>
                                        </div>
                                    ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">{t('profile.noAchievements')}</p>
                                )}
                                <button onClick={() => dispatch({type: 'SET_VIEW', payload: 'achievements'})} className="mt-4 w-full text-center text-sm font-semibold text-primary hover:underline">
                                    View all
                                </button>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
            {isEditModalOpen && user && (
                <EditProfileModal
                    user={user}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveProfile}
                />
            )}
        </>
    );
};

export default ProfileView;
