import { useReducer, useEffect, useCallback } from 'react';
import { taskManagerReducer, getInitialState, Action } from '../tasks/reducer';
import { AppState } from '../types';
import { StorageService, STORAGE_KEYS } from '../utils/storage';

interface UseTaskManagerOptions {
  storageAdapter?: any;
  autoSave?: boolean;
}

export function useTaskManager(options: UseTaskManagerOptions = {}) {
  const { storageAdapter, autoSave = true } = options;
  
  const [state, dispatch] = useReducer(taskManagerReducer, getInitialState());
  
  // Initialize storage service if adapter provided
  const storageService = storageAdapter ? new StorageService(storageAdapter) : null;

  // Load state from storage on mount
  useEffect(() => {
    if (storageService && autoSave) {
      loadState();
    }
  }, [storageService, autoSave]);

  // Auto-save state to storage when it changes
  useEffect(() => {
    if (storageService && autoSave) {
      saveState();
    }
  }, [state, storageService, autoSave]);

  const loadState = useCallback(async () => {
    if (!storageService) return;
    
    try {
      const savedState = await storageService.get<AppState>(STORAGE_KEYS.TASKS);
      if (savedState) {
        dispatch({ type: 'LOAD_STATE', payload: savedState });
      }
    } catch (error) {
      console.warn('Failed to load state from storage:', error);
    }
  }, [storageService]);

  const saveState = useCallback(async () => {
    if (!storageService) return;
    
    try {
      await storageService.set(STORAGE_KEYS.TASKS, state);
    } catch (error) {
      console.warn('Failed to save state to storage:', error);
    }
  }, [storageService, state]);

  // Task actions
  const addTask = useCallback((task: Omit<AppState['tasks'][0], 'id'>) => {
    dispatch({ type: 'ADD_TASK', payload: task });
  }, []);

  const updateTask = useCallback((task: AppState['tasks'][0]) => {
    dispatch({ type: 'UPDATE_TASK', payload: task });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: taskId });
  }, []);

  const toggleTaskCompletion = useCallback((taskId: string) => {
    dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: { taskId } });
  }, []);

  // Navigation actions
  const setView = useCallback((view: AppState['view']) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, []);

  const setSelectedTask = useCallback((taskId: string | null) => {
    dispatch({ type: 'SET_SELECTED_TASK', payload: taskId });
  }, []);

  const setActiveList = useCallback((listId: string) => {
    dispatch({ type: 'SET_ACTIVE_LIST', payload: listId });
  }, []);

  // Habit actions
  const addHabit = useCallback((habit: Omit<AppState['habits'][0], 'id' | 'completions' | 'createdAt'>) => {
    dispatch({ type: 'ADD_HABIT', payload: habit });
  }, []);

  const toggleHabitCompletion = useCallback((habitId: string, date: string) => {
    dispatch({ type: 'TOGGLE_HABIT_COMPLETION', payload: { habitId, date } });
  }, []);

  // Pomodoro actions
  const startTimer = useCallback(() => {
    dispatch({ type: 'START_TIMER' });
  }, []);

  const pauseTimer = useCallback(() => {
    dispatch({ type: 'PAUSE_TIMER' });
  }, []);

  const resetTimer = useCallback(() => {
    dispatch({ type: 'RESET_TIMER' });
  }, []);

  const tickTimer = useCallback(() => {
    dispatch({ type: 'TICK_TIMER' });
  }, []);

  // Mobile-specific actions
  const setOnlineStatus = useCallback((isOnline: boolean) => {
    dispatch({ type: 'SET_ONLINE_STATUS', payload: isOnline });
  }, []);

  const setSyncState = useCallback((syncStatus: AppState['syncStatus']) => {
    dispatch({ type: 'SET_SYNC_STATE', payload: syncStatus });
  }, []);

  return {
    state,
    dispatch,
    
    // Task methods
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    
    // Navigation methods
    setView,
    setSelectedTask,
    setActiveList,
    
    // Habit methods
    addHabit,
    toggleHabitCompletion,
    
    // Pomodoro methods
    startTimer,
    pauseTimer,
    resetTimer,
    tickTimer,
    
    // Mobile methods
    setOnlineStatus,
    setSyncState,
    
    // Storage methods
    loadState,
    saveState,
  };
}
