import { AppDate, EntityId } from './common';

export interface Habit {
  id: EntityId;
  name: string;
  completions: AppDate[];
  createdAt: AppDate;
  targetDays?: number; // Mobile: target days per week/month
  streak?: number; // Mobile: current streak
  bestStreak?: number; // Mobile: best streak
  color?: string; // Mobile: habit color for UI
  icon?: string; // Mobile: habit icon name
  reminderTime?: string; // Mobile: HH:MM format for daily reminder
}

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  completionRate: number; // percentage
  monthlyCompletions: number[];
  weeklyCompletions: number[];
}

export interface HabitFilter {
  active?: boolean;
  timeframe?: 'week' | 'month' | 'year';
}
