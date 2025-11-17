import * as ActionTypes from './action-types';
import type { Task, List, Column, Habit, CountdownEvent, PomodoroState } from '../types';

// View and navigation actions
export const setView = (view: any) => ({ type: ActionTypes.SET_VIEW, payload: view });
export const setSelectedTask = (taskId: string | null) => ({ type: ActionTypes.SET_SELECTED_TASK, payload: taskId });
export const setActiveList = (listId: string) => ({ type: ActionTypes.SET_ACTIVE_LIST, payload: listId });
export const setActiveTag = (tag: string | null) => ({ type: ActionTypes.SET_ACTIVE_TAG, payload: tag });

// Tag actions
export const addTag = (name: string) => ({ type: ActionTypes.ADD_TAG, payload: { name } });
export const deleteTag = (tag: string) => ({ type: ActionTypes.DELETE_TAG, payload: tag });

// Task actions
export const addTask = (task: Omit<Task, 'id'> & { id?: string }) => ({ type: ActionTypes.ADD_TASK, payload: task });
export const updateTask = (task: Task) => ({ type: ActionTypes.UPDATE_TASK, payload: task });
export const deleteTask = (taskId: string) => ({ type: ActionTypes.DELETE_TASK, payload: taskId });
export const toggleTaskCompletion = (taskId: string) => ({ type: ActionTypes.TOGGLE_TASK_COMPLETION, payload: { taskId } });
export const assignTask = (taskId: string, userId: string | null) => ({ type: ActionTypes.ASSIGN_TASK, payload: { taskId, userId } });
export const addComment = (taskId: string, comment: any) => ({ type: ActionTypes.ADD_COMMENT, payload: { taskId, comment } });

// List actions
export const addList = (list: Omit<List, 'id'>) => ({ type: ActionTypes.ADD_LIST, payload: list });
export const updateList = (list: List) => ({ type: ActionTypes.UPDATE_LIST, payload: list });
export const deleteList = (listId: string) => ({ type: ActionTypes.DELETE_LIST, payload: listId });
export const shareList = (listId: string, userId: string) => ({ type: ActionTypes.SHARE_LIST, payload: { listId, userId } });
export const unshareList = (listId: string, userId: string) => ({ type: ActionTypes.UNSHARE_LIST, payload: { listId, userId } });

// Column actions
export const addColumn = (name: string, listId: string) => ({ type: ActionTypes.ADD_COLUMN, payload: { name, listId } });
export const updateColumn = (columnId: string, name: string) => ({ type: ActionTypes.UPDATE_COLUMN, payload: { columnId, name } });
export const deleteColumn = (columnId: string, listId: string) => ({ type: ActionTypes.DELETE_COLUMN, payload: { columnId, listId } });
export const moveTaskToColumn = (taskId: string, newColumnId: string, listId: string) => ({ type: ActionTypes.MOVE_TASK_TO_COLUMN, payload: { taskId, newColumnId, listId } });
export const reorderColumns = (listId: string, draggedId: string, droppedOnId: string) => ({ type: ActionTypes.REORDER_COLUMNS, payload: { listId, draggedId, droppedOnId } });

// Habit actions
export const addHabit = (habit: Omit<Habit, 'id' | 'completions' | 'createdAt'>) => ({ type: ActionTypes.ADD_HABIT, payload: habit });
export const updateHabit = (habit: Habit) => ({ type: ActionTypes.UPDATE_HABIT, payload: habit });
export const deleteHabit = (habitId: string) => ({ type: ActionTypes.DELETE_HABIT, payload: habitId });
export const toggleHabitCompletion = (habitId: string, date: string) => ({ type: ActionTypes.TOGGLE_HABIT_COMPLETION, payload: { habitId, date } });

// Countdown actions
export const addCountdown = (event: CountdownEvent) => ({ type: ActionTypes.ADD_COUNTDOWN, payload: event });
export const updateCountdown = (event: CountdownEvent) => ({ type: ActionTypes.UPDATE_COUNTDOWN, payload: event });
export const deleteCountdown = (eventId: string) => ({ type: ActionTypes.DELETE_COUNTDOWN, payload: eventId });

// Pomodoro actions
export const startTimer = () => ({ type: ActionTypes.START_TIMER });
export const pauseTimer = () => ({ type: ActionTypes.PAUSE_TIMER });
export const resetTimer = () => ({ type: ActionTypes.RESET_TIMER });
export const tickTimer = () => ({ type: ActionTypes.TICK_TIMER });
export const setFocusedTask = (taskId: string | null) => ({ type: ActionTypes.SET_FOCUSED_TASK, payload: taskId });
export const completePomodoroSession = () => ({ type: ActionTypes.COMPLETE_POMODORO_SESSION });
export const updatePomodoroSettings = (settings: Partial<PomodoroState['settings']>) => ({ type: ActionTypes.UPDATE_POMODORO_SETTINGS, payload: settings });
export const skipBreak = () => ({ type: ActionTypes.SKIP_BREAK });

// Mobile-specific actions
export const setOnlineStatus = (isOnline: boolean) => ({ type: ActionTypes.SET_ONLINE_STATUS, payload: isOnline });
export const setSyncState = (syncStatus: 'synced' | 'syncing' | 'error') => ({ type: ActionTypes.SET_SYNC_STATE, payload: syncStatus });
export const backgroundTimerUpdate = (remainingTime: number, isActive: boolean) => ({ type: ActionTypes.BACKGROUND_TIMER_UPDATE, payload: { remainingTime, isActive } });
export const setNotificationPermissions = (hasPermission: boolean) => ({ type: ActionTypes.SET_NOTIFICATION_PERMISSIONS, payload: hasPermission });
export const addPendingChange = (change: { type: string; data: any }) => ({ type: ActionTypes.ADD_PENDING_CHANGE, payload: change });
export const clearPendingChanges = () => ({ type: ActionTypes.CLEAR_PENDING_CHANGES });

// State management
export const loadState = (state: any) => ({ type: ActionTypes.LOAD_STATE, payload: state });
export const resetState = () => ({ type: ActionTypes.RESET_STATE });

// Action creators grouped by domain
export const taskActions = {
  add: addTask,
  update: updateTask,
  delete: deleteTask,
  toggleCompletion: toggleTaskCompletion,
  assign: assignTask,
  addComment: addComment,
};

export const listActions = {
  add: addList,
  update: updateList,
  delete: deleteList,
  share: shareList,
  unshare: unshareList,
};

export const boardActions = {
  addColumn,
  updateColumn,
  deleteColumn,
  moveTask: moveTaskToColumn,
  reorderColumns,
};

export const habitActions = {
  add: addHabit,
  update: updateHabit,
  delete: deleteHabit,
  toggleCompletion: toggleHabitCompletion,
};

export const countdownActions = {
  add: addCountdown,
  update: updateCountdown,
  delete: deleteCountdown,
};

export const pomodoroActions = {
  start: startTimer,
  pause: pauseTimer,
  reset: resetTimer,
  tick: tickTimer,
  setFocusedTask,
  completeSession: completePomodoroSession,
  updateSettings: updatePomodoroSettings,
  skipBreak,
};

export const mobileActions = {
  setOnlineStatus,
  setSyncState,
  backgroundTimerUpdate,
  setNotificationPermissions,
  addPendingChange,
  clearPendingChanges,
};

export const navigationActions = {
  setView,
  setSelectedTask,
  setActiveList,
  setActiveTag,
};

export const tagActions = {
  add: addTag,
  delete: deleteTag,
};
