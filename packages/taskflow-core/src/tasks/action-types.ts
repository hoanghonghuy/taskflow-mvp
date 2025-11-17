// View and navigation actions
export const SET_VIEW = 'SET_VIEW' as const;
export const SET_SELECTED_TASK = 'SET_SELECTED_TASK' as const;
export const SET_ACTIVE_LIST = 'SET_ACTIVE_LIST' as const;
export const SET_ACTIVE_TAG = 'SET_ACTIVE_TAG' as const;

// Tag actions
export const ADD_TAG = 'ADD_TAG' as const;
export const DELETE_TAG = 'DELETE_TAG' as const;

// Task actions
export const ADD_TASK = 'ADD_TASK' as const;
export const UPDATE_TASK = 'UPDATE_TASK' as const;
export const DELETE_TASK = 'DELETE_TASK' as const;
export const TOGGLE_TASK_COMPLETION = 'TOGGLE_TASK_COMPLETION' as const;
export const ASSIGN_TASK = 'ASSIGN_TASK' as const;
export const ADD_COMMENT = 'ADD_COMMENT' as const;

// List actions
export const ADD_LIST = 'ADD_LIST' as const;
export const UPDATE_LIST = 'UPDATE_LIST' as const;
export const DELETE_LIST = 'DELETE_LIST' as const;
export const SHARE_LIST = 'SHARE_LIST' as const;
export const UNSHARE_LIST = 'UNSHARE_LIST' as const;

// Column actions (board view)
export const ADD_COLUMN = 'ADD_COLUMN' as const;
export const UPDATE_COLUMN = 'UPDATE_COLUMN' as const;
export const DELETE_COLUMN = 'DELETE_COLUMN' as const;
export const MOVE_TASK_TO_COLUMN = 'MOVE_TASK_TO_COLUMN' as const;
export const REORDER_COLUMNS = 'REORDER_COLUMNS' as const;

// Habit actions
export const ADD_HABIT = 'ADD_HABIT' as const;
export const UPDATE_HABIT = 'UPDATE_HABIT' as const;
export const DELETE_HABIT = 'DELETE_HABIT' as const;
export const TOGGLE_HABIT_COMPLETION = 'TOGGLE_HABIT_COMPLETION' as const;

// Countdown actions
export const ADD_COUNTDOWN = 'ADD_COUNTDOWN' as const;
export const UPDATE_COUNTDOWN = 'UPDATE_COUNTDOWN' as const;
export const DELETE_COUNTDOWN = 'DELETE_COUNTDOWN' as const;

// Pomodoro actions
export const START_TIMER = 'START_TIMER' as const;
export const PAUSE_TIMER = 'PAUSE_TIMER' as const;
export const RESET_TIMER = 'RESET_TIMER' as const;
export const TICK_TIMER = 'TICK_TIMER' as const;
export const SET_FOCUSED_TASK = 'SET_FOCUSED_TASK' as const;
export const COMPLETE_POMODORO_SESSION = 'COMPLETE_POMODORO_SESSION' as const;
export const UPDATE_POMODORO_SETTINGS = 'UPDATE_POMODORO_SETTINGS' as const;
export const SKIP_BREAK = 'SKIP_BREAK' as const;

// Mobile-specific actions
export const SET_ONLINE_STATUS = 'SET_ONLINE_STATUS' as const;
export const SET_SYNC_STATE = 'SET_SYNC_STATE' as const;
export const BACKGROUND_TIMER_UPDATE = 'BACKGROUND_TIMER_UPDATE' as const;
export const SET_NOTIFICATION_PERMISSIONS = 'SET_NOTIFICATION_PERMISSIONS' as const;
export const ADD_PENDING_CHANGE = 'ADD_PENDING_CHANGE' as const;
export const CLEAR_PENDING_CHANGES = 'CLEAR_PENDING_CHANGES' as const;

// State management
export const LOAD_STATE = 'LOAD_STATE' as const;
export const RESET_STATE = 'RESET_STATE' as const;
