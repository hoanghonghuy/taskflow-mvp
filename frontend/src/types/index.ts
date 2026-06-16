export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export type SortOrder = 'default' | 'dueDateAsc' | 'dueDateDesc';

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  dueDate?: string;
  priority: Priority;
  listId: string;
  columnId?: string;
  tags: string[];
  subtasks: Subtask[];
  recurrence?: RecurrencePattern;
  reminderMinutes?: number;
  assigneeId?: string | null;
  comments: Comment[];
  createdAt?: string;
  totalFocusTime?: number;
  sortOrder?: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
  completedDates?: string[];
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
}

export interface List {
  id: string;
  name: string;
  color: string;
  members: string[];
  ownerUserId?: string;
}

export interface Column {
  id: string;
  name: string;
  listId: string;
}

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  avatarUrl?: string;
}

export interface Habit {
  id: string;
  name: string;
  completions: string[];
  createdAt: string;
}

export interface CountdownEvent {
  id: string;
  title: string;
  targetDate: string;
  color: string;
  createdAt?: string;
}

export interface PomodoroState {
  isActive: boolean;
  isPaused: boolean;
  remainingTime: number;
  currentSession: 'focus' | 'shortBreak' | 'longBreak';
  focusedTaskId: string | null;
  focusedHabitId: string | null;
  sessionsCompleted: number;
  focusHistory: FocusSession[];
  settings: PomodoroSettings;
}

export interface FocusSession {
  startTime: string;
  duration: number;
  taskId?: string;
  habitId?: string;
}

export interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

export type ThemePresetId =
  | 'light'
  | 'dark'
  | 'classic-fog'
  | 'warm-ivory'
  | 'cool-slate'
  | 'minimal-charcoal'
  | 'soft-pastel'
  | 'night-indigo'
  | 'graphite-ember'
  | 'forest-noir'
  | 'plum-eclipse'
  | 'carbon-minimal';

export type ThemeOption = ThemePresetId | 'system';

export interface Settings {
  language: 'en' | 'vi';
  theme: ThemeOption;
  notifications: boolean;
  soundEnabled: boolean;
  autoStartPomodoro: boolean;
  defaultPriority: Priority;
  defaultListId: string;
  bottomNavActions?: View[];
}

export type View = 
  | 'dashboard' 
  | 'list' 
  | 'board' 
  | 'calendar' 
  | 'pomodoro' 
  | 'matrix' 
  | 'habit' 
  | 'countdown' 
  | 'settings' 
  | 'achievements' 
  | 'profile';

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
  sortOrder: SortOrder;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  groundingSources?: GroundingSource[];
}

export interface GroundingSource {
  uri: string;
  title: string;
}