
import React from 'react';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export enum Priority {
  None = 0,
  Low = 1,
  Medium = 2,
  High = 3,
}

export type RecurrenceRule = 'daily' | 'weekly' | 'monthly';

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Column {
  id: string;
  name: string;
  listId: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string; // ISO string when completed
  dueDate?: string;
  priority: Priority;
  listId: string;
  columnId?: string;
  tags: string[];
  subtasks: Subtask[];
  createdAt: string;
  groundingSources?: GroundingSource[];
  totalFocusTime: number; // in seconds
  recurrence?: {
    rule: RecurrenceRule;
  };
  reminderMinutes?: number; // e.g. 5, 15, 30
  assigneeId?: string;
  comments?: Comment[];
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface List {
  id: string;
  name: string;
  color: string;
  members?: string[]; // Array of user IDs
}

export interface Habit {
  id: string;
  name: string;
  completions: string[]; // Array of 'YYYY-MM-DD' date strings
  createdAt: string;
}

export interface CountdownEvent {
  id: string;
  name: string;
  targetDate: string; // ISO string
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.FC<{className?: string}>;
    condition: (state: AppState) => boolean;
}


export type SpecialList = 'inbox' | 'today' | 'upcoming';

export type SortOrder = 'default' | 'dueDateAsc' | 'dueDateDesc';

export type PomodoroSessionType = 'pomo' | 'shortBreak' | 'longBreak';

export interface PomodoroFocusRecord {
    startTime: string;
    endTime: string;
    duration: number; // in seconds
    taskId: string | null;
}

export interface PomodoroState {
    isActive: boolean;
    isPaused: boolean;
    remainingTime: number; // in seconds
    currentSession: PomodoroSessionType;
    currentCycle: number;
    focusedTaskId: string | null;
    focusHistory: PomodoroFocusRecord[];
    settings: {
        pomoDuration: number;
        shortBreakDuration: number;
        longBreakDuration: number;
        longBreakInterval: number; // in cycles
    };
}

// FIX: Added 'profile' to ViewType to allow it as a valid view.
export type ViewType = 'list' | 'calendar' | 'pomodoro' | 'matrix' | 'habit' | 'countdown' | 'settings' | 'dashboard' | 'achievements' | 'board' | 'profile';

export type Action =
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK_COMPLETION'; payload: { taskId: string } }
  | { type: 'ADD_LIST'; payload: { name: string } }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SET_ACTIVE_LIST'; payload: string | SpecialList }
  | { type: 'SET_SELECTED_TASK'; payload: string | null }
  | { type: 'SET_SORT_ORDER'; payload: SortOrder }
  | { type: 'REORDER_TASKS'; payload: { draggedId: string; droppedOnId: string } }
  | { type: 'SET_ACTIVE_TAG'; payload: string | null }
  | { type: 'SET_VIEW'; payload: ViewType }
  | { type: 'SET_TASK_RECURRENCE', payload: { taskId: string, recurrence: Task['recurrence'] } }
  | { type: 'SET_TASK_REMINDER', payload: { taskId: string, reminderMinutes: number | undefined } }
  | { type: 'ADD_TAG', payload: { name: string } }
  | { type: 'DELETE_TAG', payload: string }
  | { type: 'ASSIGN_TASK'; payload: { taskId: string; userId: string | null } }
  | { type: 'ADD_COMMENT'; payload: { taskId: string; comment: Comment } }
  | { type: 'UPDATE_LIST_MEMBERS'; payload: { listId: string; memberIds: string[] } }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: string }
  | { type: 'ADD_COLUMN'; payload: { listId: string; name: string } }
  | { type: 'UPDATE_COLUMN'; payload: { columnId: string; name: string } }
  | { type: 'DELETE_COLUMN'; payload: { columnId: string; listId: string } }
  | { type: 'REORDER_COLUMNS'; payload: { listId: string; draggedId: string; droppedOnId: string } }
  | { type: 'MOVE_TASK_TO_COLUMN'; payload: { taskId: string; newColumnId: string; listId: string } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'START_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'STOP_TIMER' }
  | { type: 'TICK' }
  | { type: 'SWITCH_SESSION' }
  | { type: 'SET_FOCUSED_TASK', payload: string | null }
  | { type: 'ADD_HABIT', payload: { name: string } }
  | { type: 'TOGGLE_HABIT_COMPLETION', payload: { habitId: string, date: string } }
  | { type: 'DELETE_HABIT', payload: string }
  | { type: 'ADD_COUNTDOWN', payload: CountdownEvent }
  | { type: 'DELETE_COUNTDOWN', payload: string }
  | { type: 'UPDATE_POMODORO_SETTINGS', payload: Partial<PomodoroState['settings']> };


export interface AppState {
  tasks: Task[];
  lists: List[];
  columns: Column[];
  tags: string[];
  habits: Habit[];
  countdownEvents: CountdownEvent[];
  unlockedAchievements: string[];
  activeListId: string | SpecialList;
  selectedTaskId: string | null;
  sortOrder: SortOrder;
  activeTag: string | null;
  pomodoro: PomodoroState;
  view: ViewType;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  groundingSources?: GroundingSource[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}
