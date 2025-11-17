import { AppDate, EntityId } from './common';
export interface Habit {
    id: EntityId;
    name: string;
    completions: AppDate[];
    createdAt: AppDate;
    targetDays?: number;
    streak?: number;
    bestStreak?: number;
    color?: string;
    icon?: string;
    reminderTime?: string;
}
export interface HabitStats {
    currentStreak: number;
    bestStreak: number;
    totalCompletions: number;
    completionRate: number;
    monthlyCompletions: number[];
    weeklyCompletions: number[];
}
export interface HabitFilter {
    active?: boolean;
    timeframe?: 'week' | 'month' | 'year';
}
