export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
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
}

export interface Column {
  id: string;
  name: string;
  listId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
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
}

export interface PomodoroState {
  isActive: boolean;
  isPaused: boolean;
  remainingTime: number;
  currentSession: 'focus' | 'shortBreak' | 'longBreak';
  focusHistory: FocusSession[];
  settings: PomodoroSettings;
}

export interface FocusSession {
  date: string;
  duration: number;
  taskId?: string;
}

export interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

export interface Settings {
  language: 'en' | 'vi';
  theme: 'light' | 'dark';
  notifications: boolean;
  autoStartPomodoro: boolean;
  defaultPriority: Priority;
  defaultListId: string;
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
  pomodoro: PomodoroState;
}

// Add missing fields to AppState
export interface AppState {
  view: View;
  tasks: Task[];
  lists: List[];
  columns: Column[];
  habits: Habit[];
  countdownEvents: CountdownEvent[];
  selectedTaskId: string | null;
  pomodoro: PomodoroState;
  unlockedAchievements: string[];
}

// Update PomodoroState to include missing fields
export interface PomodoroState {
  isActive: boolean;
  isPaused: boolean;
  remainingTime: number;
  currentSession: 'focus' | 'shortBreak' | 'longBreak';
  focusedTaskId: string | null;
  sessionsCompleted: number;
  focusHistory: FocusSession[];
  settings: PomodoroSettings;
}
