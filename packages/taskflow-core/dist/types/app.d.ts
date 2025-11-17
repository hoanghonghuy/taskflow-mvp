import { View, ThemeOption, Priority } from './common';
import { Task, List, Column } from './task';
import { Habit } from './habit';
import { PomodoroState } from './pomodoro';
import { CountdownEvent } from './countdown';
export interface Settings {
    language: 'en' | 'vi';
    theme: ThemeOption;
    notifications: boolean;
    soundEnabled: boolean;
    autoStartPomodoro: boolean;
    defaultPriority: Priority;
    defaultListId: string;
    bottomNavActions?: View[];
    biometricAuth?: boolean;
    hapticFeedback?: boolean;
    darkModeAuto?: boolean;
    dataSyncEnabled?: boolean;
    backupToCloud?: boolean;
}
export interface AppState {
    view: View;
    tasks: Task[];
    lists: List[];
    columns: Column[];
    habits: Habit[];
    countdownEvents: CountdownEvent[];
    selectedTaskId: string | null;
    activeListId: string;
    activeTag: string | null;
    tags: string[];
    pomodoro: PomodoroState;
    unlockedAchievements: string[];
    sortOrder: 'default' | 'dueDateAsc' | 'dueDateDesc';
    isOnline: boolean;
    syncStatus: 'synced' | 'syncing' | 'error';
    lastSyncTime?: Date;
    notificationPermissions: boolean;
    pendingChanges: number;
}
