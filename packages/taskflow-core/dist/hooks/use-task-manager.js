"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTaskManager = useTaskManager;
const react_1 = require("react");
const reducer_1 = require("../tasks/reducer");
const storage_1 = require("../utils/storage");
function useTaskManager(options = {}) {
    const { storageAdapter, autoSave = true } = options;
    const [state, dispatch] = (0, react_1.useReducer)(reducer_1.taskManagerReducer, (0, reducer_1.getInitialState)());
    // Initialize storage service if adapter provided
    const storageService = storageAdapter ? new storage_1.StorageService(storageAdapter) : null;
    // Load state from storage on mount
    (0, react_1.useEffect)(() => {
        if (storageService && autoSave) {
            loadState();
        }
    }, [storageService, autoSave]);
    // Auto-save state to storage when it changes
    (0, react_1.useEffect)(() => {
        if (storageService && autoSave) {
            saveState();
        }
    }, [state, storageService, autoSave]);
    const loadState = (0, react_1.useCallback)(async () => {
        if (!storageService)
            return;
        try {
            const savedState = await storageService.get(storage_1.STORAGE_KEYS.TASKS);
            if (savedState) {
                dispatch({ type: 'LOAD_STATE', payload: savedState });
            }
        }
        catch (error) {
            console.warn('Failed to load state from storage:', error);
        }
    }, [storageService]);
    const saveState = (0, react_1.useCallback)(async () => {
        if (!storageService)
            return;
        try {
            await storageService.set(storage_1.STORAGE_KEYS.TASKS, state);
        }
        catch (error) {
            console.warn('Failed to save state to storage:', error);
        }
    }, [storageService, state]);
    // Task actions
    const addTask = (0, react_1.useCallback)((task) => {
        dispatch({ type: 'ADD_TASK', payload: task });
    }, []);
    const updateTask = (0, react_1.useCallback)((task) => {
        dispatch({ type: 'UPDATE_TASK', payload: task });
    }, []);
    const deleteTask = (0, react_1.useCallback)((taskId) => {
        dispatch({ type: 'DELETE_TASK', payload: taskId });
    }, []);
    const toggleTaskCompletion = (0, react_1.useCallback)((taskId) => {
        dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: { taskId } });
    }, []);
    // Navigation actions
    const setView = (0, react_1.useCallback)((view) => {
        dispatch({ type: 'SET_VIEW', payload: view });
    }, []);
    const setSelectedTask = (0, react_1.useCallback)((taskId) => {
        dispatch({ type: 'SET_SELECTED_TASK', payload: taskId });
    }, []);
    const setActiveList = (0, react_1.useCallback)((listId) => {
        dispatch({ type: 'SET_ACTIVE_LIST', payload: listId });
    }, []);
    // Habit actions
    const addHabit = (0, react_1.useCallback)((habit) => {
        dispatch({ type: 'ADD_HABIT', payload: habit });
    }, []);
    const toggleHabitCompletion = (0, react_1.useCallback)((habitId, date) => {
        dispatch({ type: 'TOGGLE_HABIT_COMPLETION', payload: { habitId, date } });
    }, []);
    // Pomodoro actions
    const startTimer = (0, react_1.useCallback)(() => {
        dispatch({ type: 'START_TIMER' });
    }, []);
    const pauseTimer = (0, react_1.useCallback)(() => {
        dispatch({ type: 'PAUSE_TIMER' });
    }, []);
    const resetTimer = (0, react_1.useCallback)(() => {
        dispatch({ type: 'RESET_TIMER' });
    }, []);
    const tickTimer = (0, react_1.useCallback)(() => {
        dispatch({ type: 'TICK_TIMER' });
    }, []);
    // Mobile-specific actions
    const setOnlineStatus = (0, react_1.useCallback)((isOnline) => {
        dispatch({ type: 'SET_ONLINE_STATUS', payload: isOnline });
    }, []);
    const setSyncState = (0, react_1.useCallback)((syncStatus) => {
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
