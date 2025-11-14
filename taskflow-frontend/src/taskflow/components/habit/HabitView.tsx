'use client'

import React, { useState } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { Habit } from '../../types';
import { PlusIcon, TrashIcon, ArrowDownIcon } from '../../constants';
import { useConfirmation } from '../../hooks/useConfirmation';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from '../../hooks/useI18n';
import { useSettings } from '../../hooks/useSettings';

const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];

const calculateStreak = (completions: string[]): number => {
    if (completions.length === 0) return 0;

    const sortedDates = completions.map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
    let streak = 0;
    let today = new Date();
    
    // Check if latest completion is today or yesterday
    const latestCompletion = sortedDates[0];
    const todayStr = toYYYYMMDD(today);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toYYYYMMDD(yesterday);
    const latestCompletionStr = toYYYYMMDD(latestCompletion);

    if (latestCompletionStr === todayStr || latestCompletionStr === yesterdayStr) {
        streak = 1;
        let currentStreakDate = latestCompletion;
        for (let i = 1; i < sortedDates.length; i++) {
            const nextExpectedDate = new Date(currentStreakDate);
            nextExpectedDate.setDate(nextExpectedDate.getDate() - 1);
            if (toYYYYMMDD(sortedDates[i]) === toYYYYMMDD(nextExpectedDate)) {
                streak++;
                currentStreakDate = sortedDates[i];
            } else if (toYYYYMMDD(sortedDates[i]) !== toYYYYMMDD(currentStreakDate)) {
                // a gap in dates
                break;
            }
        }
    }

    return streak;
};

const HabitHeatmap: React.FC<{ completions: string[] }> = ({ completions }) => {
    const { t } = useTranslation();
    const { language } = useSettings();
    const today = new Date();
    const startDate = new Date();
    startDate.setMonth(today.getMonth() - 5);
    startDate.setDate(1);

    const completionsSet = new Set(completions);
    const days = [];
    let currentDate = new Date(startDate);
    
    // Pad start date to be a Monday
    const dayOfWeek = (startDate.getDay() + 6) % 7; // Monday is 0
    for (let i = 0; i < dayOfWeek; i++) {
        days.push({ date: null, completed: false });
    }

    while (currentDate <= today) {
        const dateStr = toYYYYMMDD(currentDate);
        days.push({ date: new Date(currentDate), completed: completionsSet.has(dateStr) });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const monthLabels = Array.from({ length: 6 }).map((_, i) => {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        return date.toLocaleDateString(language, { month: 'short' });
    }).reverse();

    return (
        <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(1rem,1fr))] grid-rows-7 grid-flow-col gap-1">
                {days.map((day, index) => (
                    <div
                        key={index}
                        className={`w-4 h-4 rounded-sm ${day.date ? (day.completed ? 'bg-primary' : 'bg-muted') : 'bg-transparent'}`}
                        title={day.date ? t(day.completed ? 'habit.heatmap.tooltip.completed' : 'habit.heatmap.tooltip.notCompleted', { date: day.date.toLocaleDateString() }) : ''}
                    />
                ))}
            </div>
             <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                {monthLabels.map(label => <span key={label}>{label}</span>)}
            </div>
        </div>
    );
};


const HabitItem: React.FC<{ habit: Habit }> = ({ habit }) => {
    const { dispatch } = useTaskManager();
    const { confirm } = useConfirmation();
    const { t } = useTranslation();
    const { language } = useSettings();
    const addToast = useToast();
    const [isExpanded, setIsExpanded] = useState(false);

    const today = new Date();
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(today.getDate() - (6 - i));
        return date;
    });

    const completionsSet = new Set(habit.completions);
    const streak = calculateStreak(habit.completions);

    const handleToggle = (date: Date) => {
        dispatch({
            type: 'TOGGLE_HABIT_COMPLETION',
            payload: { habitId: habit.id, date: toYYYYMMDD(date) }
        });
    };
    
    const handleDelete = async () => {
        const isConfirmed = await confirm({
            title: t('habit.deleteConfirm.title', { habitName: habit.name }),
            message: t('habit.deleteConfirm.message'),
            confirmText: t('habit.deleteConfirm.confirmText'),
        });
        if (isConfirmed) {
            dispatch({ type: 'DELETE_HABIT', payload: habit.id });
            addToast(t('habit.deleteSuccess', { habitName: habit.name }), 'success');
        }
    }

    return (
         <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-grow">
                    <h3 className="font-semibold">{habit.name}</h3>
                    <p className="text-sm text-muted-foreground">{streak > 0 ? t('habit.streak', { count: streak }) : t('habit.noStreak')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {weekDays.map(date => {
                            const dateString = toYYYYMMDD(date);
                            const isCompleted = completionsSet.has(dateString);
                            const isFuture = date > new Date();
                            return (
                                <button
                                    key={dateString}
                                    disabled={isFuture}
                                    onClick={() => handleToggle(date)}
                                    className={`w-8 h-8 rounded-full flex flex-col items-center justify-center transition-colors text-xs ${
                                        isCompleted ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-muted'
                                    } ${isFuture ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span>{date.toLocaleDateString(language, { weekday: 'short' })[0]}</span>
                                    <span className="font-bold">{date.getDate()}</span>
                                </button>
                            );
                        })}
                    </div>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-md text-muted-foreground hover:bg-secondary">
                        <ArrowDownIcon className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    <button onClick={handleDelete} className="p-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
            {isExpanded && <HabitHeatmap completions={habit.completions} />}
        </div>
    );
};

const HabitView: React.FC = () => {
    const { state, dispatch } = useTaskManager();
    const { t } = useTranslation();
    const [newHabitName, setNewHabitName] = useState('');

    const handleAddHabit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newHabitName.trim()) {
            dispatch({ type: 'ADD_HABIT', payload: { name: newHabitName.trim() } });
            setNewHabitName('');
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full">
            <header className="p-6 border-b border-border flex-shrink-0">
                <h1 className="text-2xl font-bold">{t('habitView.title')}</h1>
                <p className="text-muted-foreground">{t('habitView.subtitle')}</p>
            </header>
            <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                <div className="space-y-4">
                    {state.habits.length > 0 ? (
                        state.habits.map(habit => (
                            <HabitItem key={habit.id} habit={habit} />
                        ))
                    ) : (
                         <div className="text-center py-20 text-muted-foreground">
                            <h2 className="text-xl font-semibold">{t('habitView.emptyState.title')}</h2>
                            <p>{t('habitView.emptyState.subtitle')}</p>
                        </div>
                    )}
                </div>
            </main>
            <footer className="p-4 border-t border-border bg-background flex-shrink-0 md:pb-4 pb-20">
                 <form onSubmit={handleAddHabit} className="flex items-center gap-4">
                    <input
                        type="text"
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        placeholder={t('habitView.addPlaceholder')}
                        className="w-full p-3 bg-secondary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button type="submit" className="p-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                        <PlusIcon className="h-6 w-6" />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default HabitView;
