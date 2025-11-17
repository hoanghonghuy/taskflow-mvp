import { AppDate, EntityId } from './common';
export interface PomodoroState {
    isActive: boolean;
    isPaused: boolean;
    remainingTime: number;
    currentSession: 'focus' | 'shortBreak' | 'longBreak';
    focusedTaskId: EntityId | null;
    sessionsCompleted: number;
    focusHistory: FocusSession[];
    settings: PomodoroSettings;
    sessionStartTime?: AppDate;
    notificationPermission?: boolean;
    backgroundMode?: boolean;
}
export interface FocusSession {
    startTime: AppDate;
    duration: number;
    taskId?: EntityId;
    interruptions?: number;
    quality?: 'poor' | 'fair' | 'good' | 'excellent';
}
export interface PomodoroSettings {
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
    autoStartBreaks?: boolean;
    autoStartPomodoro?: boolean;
    tickSound?: boolean;
    completionSound?: boolean;
    vibration?: boolean;
    notificationSound?: string;
    keepScreenOn?: boolean;
}
export interface PomodoroStats {
    totalFocusTime: number;
    sessionsCompleted: number;
    averageSessionLength: number;
    productivityScore: number;
    dailyGoalProgress: number;
}
