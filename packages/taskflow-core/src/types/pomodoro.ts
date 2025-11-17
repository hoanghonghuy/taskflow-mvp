import { AppDate, EntityId } from './common';

export interface PomodoroState {
  isActive: boolean;
  isPaused: boolean;
  remainingTime: number; // seconds
  currentSession: 'focus' | 'shortBreak' | 'longBreak';
  focusedTaskId: EntityId | null;
  sessionsCompleted: number;
  focusHistory: FocusSession[];
  settings: PomodoroSettings;
  // Mobile-specific fields
  sessionStartTime?: AppDate;
  notificationPermission?: boolean;
  backgroundMode?: boolean;
}

export interface FocusSession {
  startTime: AppDate;
  duration: number; // seconds
  taskId?: EntityId;
  // Mobile-specific
  interruptions?: number;
  quality?: 'poor' | 'fair' | 'good' | 'excellent'; // User self-rating
}

export interface PomodoroSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsUntilLongBreak: number;
  // Mobile-specific settings
  autoStartBreaks?: boolean;
  autoStartPomodoro?: boolean;
  tickSound?: boolean;
  completionSound?: boolean;
  vibration?: boolean;
  notificationSound?: string;
  keepScreenOn?: boolean;
}

export interface PomodoroStats {
  totalFocusTime: number; // minutes today/week/month
  sessionsCompleted: number;
  averageSessionLength: number;
  productivityScore: number; // 0-100
  dailyGoalProgress: number; // percentage
}
