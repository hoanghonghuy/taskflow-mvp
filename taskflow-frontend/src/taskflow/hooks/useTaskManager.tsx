'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react';
import { AppState, Action, PomodoroState, List, Habit, CountdownEvent, PomodoroFocusRecord, Task, Priority, Comment, Column } from '../types';
import { ALL_ACHIEVEMENTS, INITIAL_LISTS, INITIAL_TASKS, POMODORO_SETTINGS, TAG_COLORS } from '../constants';
import { useToast } from './useToast';
import { useTranslation } from './useI18n';

const initialPomodoroState: PomodoroState = {
    isActive: false,
    isPaused: false,
    remainingTime: POMODORO_SETTINGS.pomoDuration,
    currentSession: 'pomo',
    currentCycle: 0,
    focusedTaskId: null,
    focusHistory: [],
    settings: POMODORO_SETTINGS,
};

const initialAppState: AppState = {
    tasks: [],
    lists: [],
    columns: [],
    tags: [],
    habits: [],
    countdownEvents: [],
    unlockedAchievements: [],
    activeListId: 'today',
    selectedTaskId: null,
    sortOrder: 'default',
    activeTag: null,
    pomodoro: initialPomodoroState,
    view: 'dashboard',
};

interface HistoryState {
    past: AppState[];
    present: AppState;
    future: AppState[];
}

const initialHistoryState: HistoryState = {
    past: [],
    present: initialAppState,
    future: [],
};

const UNDOABLE_ACTIONS = new Set([
    'ADD_TASK',
    'UPDATE_TASK',
    'DELETE_TASK',
    'TOGGLE_TASK_COMPLETION',
    'ADD_LIST',
    'DELETE_LIST',
    'REORDER_TASKS',
    'ADD_HABIT',
    'TOGGLE_HABIT_COMPLETION',
    'DELETE_HABIT',
    'ADD_COUNTDOWN',
    'DELETE_COUNTDOWN',
    'SET_TASK_RECURRENCE',
    'SET_TASK_REMINDER',
    'UPDATE_POMODORO_SETTINGS',
    'ADD_TAG',
    'DELETE_TAG',
    'ASSIGN_TASK',
    'ADD_COMMENT',
    'UPDATE_LIST_MEMBERS',
    'ADD_COLUMN',
    'UPDATE_COLUMN',
    'DELETE_COLUMN',
    'REORDER_COLUMNS',
    'MOVE_TASK_TO_COLUMN',
]);

const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
};

const sendNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, silent: false });
    } else if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
};

const getNextDueDate = (task: Task): string | undefined => {
    if (!task.recurrence || !task.dueDate) return undefined;
    
    const currentDate = new Date(task.dueDate);
    switch (task.recurrence.rule) {
        case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
        case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
        case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
    }
    return currentDate.toISOString();
}

const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'ADD_TASK': {
            const newTags = action.payload.tags.filter(tag => !state.tags.includes(tag));
            return { 
                ...state, 
                tasks: [...state.tasks, action.payload],
                tags: [...state.tags, ...newTags]
            };
        }
        case 'UPDATE_TASK': {
            const newTags = action.payload.tags.filter(tag => !state.tags.includes(tag));
            return { 
                ...state, 
                tasks: state.tasks.map(task => task.id === action.payload.id ? action.payload : task),
                tags: [...state.tags, ...newTags] 
            };
        }
        case 'DELETE_TASK':
            return { ...state, tasks: state.tasks.filter(task => task.id !== action.payload) };
        case 'TOGGLE_TASK_COMPLETION': {
            const { taskId } = action.payload;
            const newTasks = state.tasks.flatMap(task => {
                if (task.id === taskId) {
                    const isCompleting = !task.completed;
                    // If it is a recurring task being marked as complete
                    if (task.recurrence && isCompleting) {
                        const nextDueDate = getNextDueDate(task);
                        
                        // Create the next occurrence, keeping the same ID and recurrence rule
                        const nextOccurrence = { ...task, dueDate: nextDueDate, completed: false, completedAt: undefined };
                        
                        // Create a completed one-time instance for history
                        const completedInstance: Task = {
                            ...task,
                            id: `${task.id}_${new Date(task.dueDate!).toISOString()}`, // Unique ID for this instance
                            completed: true,
                            completedAt: new Date().toISOString(),
                            recurrence: undefined, // This instance doesn't recur
                        };
                        
                        // Return both the new occurrence and the completed instance
                        return [nextOccurrence, completedInstance];
                    }
                    // For non-recurring tasks or un-completing any task
                    return { ...task, completed: isCompleting, completedAt: isCompleting ? new Date().toISOString() : undefined };
                }
                return task;
            });
            return { ...state, tasks: newTasks };
        }
        case 'REORDER_TASKS': {
            const { draggedId, droppedOnId } = action.payload;
            if (draggedId === droppedOnId) return state;

            const tasks = [...state.tasks];
            const draggedIndex = tasks.findIndex(t => t.id === draggedId);
            const droppedOnIndex = tasks.findIndex(t => t.id === droppedOnId);

            if (draggedIndex === -1 || droppedOnIndex === -1) return state;

            const [draggedItem] = tasks.splice(draggedIndex, 1);
            tasks.splice(droppedOnIndex, 0, draggedItem);

            return { ...state, tasks };
        }
        case 'ADD_LIST': {
            const newList: List = {
                id: Date.now().toString(),
                name: action.payload.name,
                color: TAG_COLORS[state.lists.length % TAG_COLORS.length],
                members: ['user-001'], // Creator is always a member
            };
            // Automatically add default columns for the new list
            const newColumns: Column[] = [
                { id: `col-${newList.id}-1`, name: 'To Do', listId: newList.id },
                { id: `col-${newList.id}-2`, name: 'In Progress', listId: newList.id },
                { id: `col-${newList.id}-3`, name: 'Done', listId: newList.id },
            ];
            return { ...state, lists: [...state.lists, newList], columns: [...state.columns, ...newColumns] };
        }
        case 'DELETE_LIST': {
            const listIdToDelete = action.payload;
            const newLists = state.lists.filter(list => list.id !== listIdToDelete);
            const newTasks = state.tasks.filter(task => task.listId !== listIdToDelete);
            const newColumns = state.columns.filter(c => c.listId !== listIdToDelete);
            let newActiveListId = state.activeListId;
            if (state.activeListId === listIdToDelete) {
                newActiveListId = 'inbox'; // Default to inbox if active list is deleted
            }
            return { 
                ...state, 
                lists: newLists, 
                tasks: newTasks,
                columns: newColumns,
                activeListId: newActiveListId,
                view: newActiveListId !== state.activeListId ? 'list' : state.view,
            };
        }
        case 'ADD_TAG': {
            const newTagName = action.payload.name.trim().toLowerCase();
            if (newTagName && !state.tags.includes(newTagName)) {
                return { ...state, tags: [...state.tags, newTagName] };
            }
            return state;
        }
        case 'DELETE_TAG': {
            const tagToDelete = action.payload;
            return {
                ...state,
                tags: state.tags.filter(tag => tag !== tagToDelete),
                tasks: state.tasks.map(task => ({
                    ...task,
                    tags: task.tags.filter(tag => tag !== tagToDelete)
                })),
                activeTag: state.activeTag === tagToDelete ? null : state.activeTag,
            };
        }
        case 'ASSIGN_TASK': {
            return {
                ...state,
                tasks: state.tasks.map(task =>
                    task.id === action.payload.taskId
                        ? { ...task, assigneeId: action.payload.userId || undefined }
                        : task
                ),
            };
        }
        case 'ADD_COMMENT': {
            return {
                ...state,
                tasks: state.tasks.map(task =>
                    task.id === action.payload.taskId
                        ? { ...task, comments: [...(task.comments || []), action.payload.comment] }
                        : task
                ),
            };
        }
        case 'UPDATE_LIST_MEMBERS': {
            return {
                ...state,
                lists: state.lists.map(list =>
                    list.id === action.payload.listId
                        ? { ...list, members: action.payload.memberIds }
                        : list
                ),
            };
        }
        case 'ADD_COLUMN': {
            const newColumn: Column = {
                id: `col-${Date.now()}`,
                name: action.payload.name,
                listId: action.payload.listId,
            };
            return { ...state, columns: [...state.columns, newColumn] };
        }
        case 'UPDATE_COLUMN': {
            return {
                ...state,
                columns: state.columns.map(c => c.id === action.payload.columnId ? { ...c, name: action.payload.name } : c)
            }
        }
        case 'DELETE_COLUMN': {
            const { columnId, listId } = action.payload;
            const columnsForList = state.columns.filter(c => c.listId === listId);
            const firstColumnId = columnsForList.length > 1 ? columnsForList.find(c => c.id !== columnId)?.id : undefined;

            return {
                ...state,
                columns: state.columns.filter(c => c.id !== columnId),
                tasks: state.tasks.map(t => t.columnId === columnId ? { ...t, columnId: firstColumnId } : t)
            }
        }
        case 'REORDER_COLUMNS': {
            const { listId, draggedId, droppedOnId } = action.payload;
            if (draggedId === droppedOnId) return state;

            const otherColumns = state.columns.filter(c => c.listId !== listId);
            const listColumns = [...state.columns.filter(c => c.listId === listId)];

            const draggedIndex = listColumns.findIndex(c => c.id === draggedId);
            const droppedOnIndex = listColumns.findIndex(c => c.id === droppedOnId);

            if (draggedIndex === -1 || droppedOnIndex === -1) return state;
            
            const [draggedItem] = listColumns.splice(draggedIndex, 1);
            listColumns.splice(droppedOnIndex, 0, draggedItem);

            return { ...state, columns: [...otherColumns, ...listColumns] };
        }
        case 'MOVE_TASK_TO_COLUMN': {
            return {
                ...state,
                tasks: state.tasks.map(task =>
                    task.id === action.payload.taskId
                        ? { ...task, columnId: action.payload.newColumnId }
                        : task
                )
            };
        }
        case 'SET_ACTIVE_LIST':
            return { ...state, activeListId: action.payload, selectedTaskId: null, activeTag: null, view: 'list' };
        case 'SET_SELECTED_TASK':
            return { ...state, selectedTaskId: action.payload };
        case 'SET_SORT_ORDER':
            return { ...state, sortOrder: action.payload };
        case 'SET_ACTIVE_TAG':
            return { ...state, activeTag: action.payload, activeListId: 'inbox', selectedTaskId: null, view: 'list' };
        case 'SET_VIEW':
            return { ...state, view: action.payload, selectedTaskId: null };
        
        case 'SET_TASK_RECURRENCE':
            return {
                ...state,
                tasks: state.tasks.map(t => t.id === action.payload.taskId ? { ...t, recurrence: action.payload.recurrence } : t)
            };
        case 'SET_TASK_REMINDER':
             return {
                ...state,
                tasks: state.tasks.map(t => t.id === action.payload.taskId ? { ...t, reminderMinutes: action.payload.reminderMinutes } : t)
            };
        case 'UNLOCK_ACHIEVEMENT':
            if (state.unlockedAchievements.includes(action.payload)) {
                return state; // Already unlocked
            }
            return {
                ...state,
                unlockedAchievements: [...state.unlockedAchievements, action.payload]
            };


        // Pomodoro Actions
        case 'UPDATE_POMODORO_SETTINGS':
            return {
                ...state,
                pomodoro: {
                    ...state.pomodoro,
                    settings: {
                        ...state.pomodoro.settings,
                        ...action.payload
                    }
                }
            }
        case 'SET_FOCUSED_TASK':
            return { ...state, pomodoro: { ...state.pomodoro, focusedTaskId: action.payload } };
        case 'START_TIMER': {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
            return {
                ...state,
                pomodoro: {
                    ...state.pomodoro,
                    isActive: true,
                    isPaused: false,
                    remainingTime: state.pomodoro.remainingTime > 0 ? state.pomodoro.remainingTime : state.pomodoro.settings.pomoDuration,
                },
            };
        }
        case 'PAUSE_TIMER':
            return { ...state, pomodoro: { ...state.pomodoro, isPaused: true } };
        case 'STOP_TIMER':
            return { 
                ...state, 
                pomodoro: { 
                    ...initialPomodoroState, 
                    settings: state.pomodoro.settings, // Keep custom settings
                    focusedTaskId: state.pomodoro.focusedTaskId, 
                    focusHistory: state.pomodoro.focusHistory 
                } 
            };
        case 'TICK': {
            if (state.pomodoro.isPaused || !state.pomodoro.isActive) return state;

            const newState = {
                ...state,
                pomodoro: { ...state.pomodoro, remainingTime: state.pomodoro.remainingTime - 1 },
            };
        
            if (state.pomodoro.focusedTaskId && state.pomodoro.currentSession === 'pomo') {
                newState.tasks = newState.tasks.map(task => 
                    task.id === state.pomodoro.focusedTaskId 
                        ? { ...task, totalFocusTime: (task.totalFocusTime || 0) + 1 } 
                        : task
                );
            }
            
            return newState;
        }
        case 'SWITCH_SESSION': {
            const { pomodoro } = state;
            const { settings } = pomodoro;
            let nextSession: PomodoroState['currentSession'] = 'pomo';
            let nextCycle = pomodoro.currentCycle;
            let newFocusHistory = [...pomodoro.focusHistory];
            let notificationTitle = '';
            let notificationBody = '';

            if (pomodoro.currentSession === 'pomo') {
                nextCycle++;
                
                const sessionRecord: PomodoroFocusRecord = {
                    startTime: new Date(Date.now() - settings.pomoDuration * 1000).toISOString(),
                    endTime: new Date().toISOString(),
                    duration: settings.pomoDuration,
                    taskId: pomodoro.focusedTaskId
                };
                newFocusHistory.push(sessionRecord);

                if (nextCycle % settings.longBreakInterval === 0) {
                    nextSession = 'longBreak';
                    notificationTitle = 'Time for a long break!';
                    notificationBody = `Great work! Take a ${settings.longBreakDuration / 60}-minute break.`;
                } else {
                    nextSession = 'shortBreak';
                    notificationTitle = "Time for a short break!";
                    notificationBody = `Good job! Take a ${settings.shortBreakDuration / 60}-minute break.`;
                }
            } else {
                nextSession = 'pomo';
                notificationTitle = "Time to focus!";
                notificationBody = `Let's get back to it. Next session starting now.`;
            }

            const remainingTimeMap = {
                pomo: settings.pomoDuration,
                shortBreak: settings.shortBreakDuration,
                longBreak: settings.longBreakDuration,
            };
            
            playNotificationSound();
            sendNotification(notificationTitle, notificationBody);

            return {
                ...state,
                pomodoro: {
                    ...pomodoro,
                    currentSession: nextSession,
                    currentCycle: nextCycle,
                    remainingTime: remainingTimeMap[nextSession],
                    isPaused: false,
                    focusHistory: newFocusHistory,
                }
            };
        }

        // Habit Actions
        case 'ADD_HABIT': {
            const newHabit: Habit = {
                id: Date.now().toString(),
                name: action.payload.name,
                completions: [],
                createdAt: new Date().toISOString(),
            };
            return { ...state, habits: [...state.habits, newHabit] };
        }
        case 'TOGGLE_HABIT_COMPLETION': {
            const { habitId, date } = action.payload;
            return {
                ...state,
                habits: state.habits.map(habit => {
                    if (habit.id === habitId) {
                        const newCompletions = habit.completions.includes(date)
                            ? habit.completions.filter(d => d !== date)
                            : [...habit.completions, date];
                        return { ...habit, completions: newCompletions };
                    }
                    return habit;
                }),
            };
        }
        case 'DELETE_HABIT':
            return { ...state, habits: state.habits.filter(h => h.id !== action.payload) };

        // Countdown Actions
        case 'ADD_COUNTDOWN':
            return { ...state, countdownEvents: [...state.countdownEvents, action.payload] };
        case 'DELETE_COUNTDOWN':
            return { ...state, countdownEvents: state.countdownEvents.filter(c => c.id !== action.payload) };

        default:
            return state;
    }
};

const historyReducer = (state: HistoryState, action: Action): HistoryState => {
    const { past, present, future } = state;

    if (UNDOABLE_ACTIONS.has(action.type)) {
        const newPresent = appReducer(present, action);
        if (newPresent === present) {
            return state;
        }
        return {
            past: [...past, present],
            present: newPresent,
            future: [],
        };
    }

    switch (action.type) {
        case 'LOAD_STATE':
            return {
                past: [],
                present: action.payload,
                future: [],
            };
        case 'UNDO':
            if (past.length === 0) return state;
            const previous = past[past.length - 1];
            const newPast = past.slice(0, past.length - 1);
            return {
                past: newPast,
                present: previous,
                future: [present, ...future],
            };
        case 'REDO':
            if (future.length === 0) return state;
            const next = future[0];
            const newFuture = future.slice(1);
            return {
                past: [...past, present],
                present: next,
                future: newFuture,
            };
        case 'CLEAR_HISTORY':
            return {
                ...state,
                past: [],
                future: [],
            };
        default:
            const newPresent = appReducer(present, action);
            return {
                ...state,
                present: newPresent,
            };
    }
};

const TaskManagerContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
    canUndo: boolean;
    canRedo: boolean;
} | undefined>(undefined);

const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];

export const TaskManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [historyState, dispatch] = useReducer(historyReducer, initialHistoryState);
    const addToast = useToast();
    const { t } = useTranslation();
    const timerRef = useRef<number | null>(null);
    const reminderCheckRef = useRef<number | null>(null);
    const notifiedTaskIds = useRef<Set<string>>(new Set());
    const { pomodoro, tasks } = historyState.present;
    
    // Achievement checking logic moved to a useEffect to use toasts
    const previousStateRef = useRef<AppState>(historyState.present);

    useEffect(() => {
        const currentState = historyState.present;
        const previousState = previousStateRef.current;

        // Check for new achievements only if state has changed meaningfully
        if (currentState !== previousState) {
            const newlyUnlocked = ALL_ACHIEVEMENTS.filter(ach => 
                !previousState.unlockedAchievements.includes(ach.id) && ach.condition(currentState)
            );

            newlyUnlocked.forEach(ach => {
                dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: ach.id });
                addToast(`🏆 Achievement Unlocked: ${t(ach.title)}`, 'success');
            });
        }
        
        previousStateRef.current = currentState;

    }, [historyState.present, t, addToast]);


    useEffect(() => {
        try {
            const storedState = localStorage.getItem('taskflowState');
            if (storedState) {
                const parsedState = JSON.parse(storedState);
                
                const safeTasks = (parsedState.tasks || []).map((t: any) => ({
                    ...t,
                    totalFocusTime: t.totalFocusTime || 0,
                    assigneeId: t.assigneeId,
                    comments: t.comments || [],
                }));

                const safeLists = (parsedState.lists || []).map((l: any) => ({
                    ...l,
                    members: l.members || ['user-001'],
                }));
                
                let tags = parsedState.tags || [];
                // Backward compatibility: if tags array doesn't exist, create it from tasks
                if (!parsedState.tags && parsedState.tasks) {
                    const derivedTags = new Set<string>();
                    parsedState.tasks.forEach((task: Task) => task.tags.forEach(tag => derivedTags.add(tag)));
                    tags = Array.from(derivedTags);
                }


                const loadedPomodoroState = {
                    ...initialPomodoroState,
                    focusHistory: parsedState.pomodoro?.focusHistory || [],
                    settings: {
                        ...POMODORO_SETTINGS,
                        ...(parsedState.pomodoro?.settings)
                    }
                };

                const loadedState: AppState = { 
                    ...initialAppState, 
                    ...parsedState,
                    tasks: safeTasks,
                    lists: safeLists,
                    columns: parsedState.columns || [],
                    tags: tags,
                    habits: parsedState.habits || [],
                    countdownEvents: parsedState.countdownEvents || [],
                    unlockedAchievements: parsedState.unlockedAchievements || [],
                    pomodoro: loadedPomodoroState,
                    sortOrder: parsedState.sortOrder || 'default', 
                    activeTag: null,
                    view: 'dashboard', // Start with dashboard
                };
                
                dispatch({ type: 'LOAD_STATE', payload: loadedState });
            } else {
                 const mockLists: List[] = [
                    { id: 'list-1', name: 'Work', color: 'bg-blue-500', members: ['user-001', 'user-002'] },
                    { id: 'list-2', name: 'Personal', color: 'bg-green-500', members: ['user-001'] },
                    { id: 'list-3', name: 'Shopping', color: 'bg-yellow-500', members: ['user-001', 'user-003'] },
                ];
                
                const mockColumns: Column[] = [
                    { id: 'col-list-1-1', name: 'To Do', listId: 'list-1' },
                    { id: 'col-list-1-2', name: 'In Progress', listId: 'list-1' },
                    { id: 'col-list-1-3', name: 'Done', listId: 'list-1' },
                    { id: 'col-list-2-1', name: 'To Buy', listId: 'list-3' },
                    { id: 'col-list-2-2', name: 'Purchased', listId: 'list-3' },
                ];

                const today = new Date();
                const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
                const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
                const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7);

                const mockTasks: Task[] = [
                    { id: 'task-1', title: 'Finalize quarterly report', description: 'Compile all data and finalize the Q3 report for the review meeting.', completed: false, dueDate: tomorrow.toISOString(), priority: Priority.High, listId: 'list-1', columnId: 'col-list-1-2', tags: ['reporting', 'urgent'], subtasks: [ {id: 's-1', title: 'Gather sales data', completed: true}, {id: 's-2', title: 'Get marketing feedback', completed: false}], createdAt: new Date().toISOString(), totalFocusTime: 3600, assigneeId: 'user-002', comments: [{id: 'c-1', userId: 'user-002', content: "I'll get the marketing feedback by EOD.", createdAt: new Date().toISOString()}] },
                    { id: 'task-2', title: 'Call the vet for appointment', description: '', completed: false, dueDate: today.toISOString(), priority: Priority.Medium, listId: 'list-2', tags: [], subtasks: [], createdAt: new Date().toISOString(), totalFocusTime: 0 },
                    { id: 'task-3', title: 'Buy groceries', description: 'Milk, bread, eggs, and cheese.', completed: true, completedAt: yesterday.toISOString(), dueDate: yesterday.toISOString(), priority: Priority.Low, listId: 'list-3', columnId: 'col-list-2-2', tags: [], subtasks: [], createdAt: new Date().toISOString(), totalFocusTime: 0, assigneeId: 'user-003' },
                    { id: 'task-4', title: 'Daily Standup Meeting', description: 'Quick sync with the team.', completed: false, dueDate: today.toISOString(), priority: Priority.Medium, listId: 'list-1', columnId: 'col-list-1-1', tags: [], subtasks: [], createdAt: new Date().toISOString(), totalFocusTime: 0, recurrence: { rule: 'daily' } },
                    { id: 'task-5', title: 'Pay electricity bill', description: 'Due by the end of the week', completed: false, dueDate: nextWeek.toISOString(), priority: Priority.High, listId: 'inbox', tags: ['bills'], subtasks: [], createdAt: new Date().toISOString(), totalFocusTime: 0 },
                    { id: 'task-6', title: 'Research new project ideas', description: '', completed: false, priority: Priority.Low, listId: 'list-1', columnId: 'col-list-1-1', tags: ['research'], subtasks: [], createdAt: new Date().toISOString(), totalFocusTime: 7200, assigneeId: 'user-001' },
                    { id: 'task-7', title: 'Schedule dentist appointment', description: '', completed: true, completedAt: today.toISOString(), priority: Priority.None, listId: 'list-2', tags: [], subtasks: [], createdAt: new Date().toISOString(), totalFocusTime: 0 },
                    { id: 'task-8', title: 'Renew gym membership', description: 'Membership expires next month.', completed: false, dueDate: nextWeek.toISOString(), priority: Priority.Medium, listId: 'list-2', tags: [], subtasks: [], createdAt: new Date().toISOString(), totalFocusTime: 0 },
                    { id: 'task-9', title: 'Submit TPS reports', description: 'Remember the new cover sheet.', completed: false, dueDate: yesterday.toISOString(), priority: Priority.High, listId: 'list-1', columnId: 'col-list-1-3', tags: ['reporting'], subtasks: [], createdAt: new Date().toISOString(), totalFocusTime: 0, assigneeId: 'user-002' },
                ];
                
                const allMockTags = new Set<string>();
                mockTasks.forEach(task => task.tags.forEach(tag => allMockTags.add(tag)));

                const dayBeforeYesterday = new Date(); dayBeforeYesterday.setDate(today.getDate() - 2);
                const mockHabits: Habit[] = [
                    { id: 'habit-1', name: 'Read for 15 minutes', completions: [toYYYYMMDD(yesterday), toYYYYMMDD(dayBeforeYesterday)], createdAt: new Date().toISOString() },
                    { id: 'habit-2', name: 'Drink 8 glasses of water', completions: [toYYYYMMDD(yesterday)], createdAt: new Date().toISOString() }
                ];

                const nextYear = new Date(); nextYear.setFullYear(today.getFullYear()); nextYear.setMonth(11); nextYear.setDate(31);
                const mockCountdowns: CountdownEvent[] = [
                    { id: 'cd-1', name: 'New Year\'s Eve', targetDate: nextYear.toISOString() }
                ];

                const mockDataState: AppState = {
                    ...initialAppState,
                    tasks: mockTasks,
                    tags: Array.from(allMockTags),
                    lists: mockLists,
                    columns: mockColumns,
                    habits: mockHabits,
                    countdownEvents: mockCountdowns,
                    view: 'dashboard',
                };
                
                dispatch({ type: 'LOAD_STATE', payload: mockDataState });
            }
        } catch (error) {
            console.error("Could not load state from localStorage", error);
            dispatch({ type: 'LOAD_STATE', payload: { ...initialAppState, tasks: INITIAL_TASKS, lists: INITIAL_LISTS, view: 'dashboard' } });
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('taskflowState', JSON.stringify(historyState.present));
        } catch (error) {
            console.error("Could not save state to localStorage", error);
        }
    }, [historyState.present]);

    useEffect(() => {
        if (pomodoro.isActive && !pomodoro.isPaused) {
            timerRef.current = window.setInterval(() => {
                dispatch({ type: 'TICK' });
            }, 1000);
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [pomodoro.isActive, pomodoro.isPaused]);

    useEffect(() => {
        if (pomodoro.remainingTime < 0 && pomodoro.isActive) {
            dispatch({ type: 'SWITCH_SESSION' });
        }
    }, [pomodoro.remainingTime, pomodoro.isActive]);

    useEffect(() => {
        const checkReminders = () => {
            const now = new Date().getTime();
            tasks.forEach(task => {
                if (task.dueDate && task.reminderMinutes && !task.completed) {
                    const dueDate = new Date(task.dueDate).getTime();
                    const reminderTime = dueDate - task.reminderMinutes * 60 * 1000;

                    if (now >= reminderTime && now < dueDate) {
                        if (!notifiedTaskIds.current.has(task.id)) {
                            sendNotification(
                                `Reminder: ${task.title}`,
                                `This task is due in ${task.reminderMinutes} minutes.`
                            );
                            notifiedTaskIds.current.add(task.id);
                        }
                    } else if (now >= dueDate) {
                        // clear notification if past due
                        notifiedTaskIds.current.delete(task.id);
                    }
                }
            });
        };
        
        // check every 30 seconds
        reminderCheckRef.current = window.setInterval(checkReminders, 30000);
        
        return () => {
            if(reminderCheckRef.current) {
                clearInterval(reminderCheckRef.current);
            }
        }
    }, [tasks]);


    const contextValue = {
        state: historyState.present,
        dispatch,
        canUndo: historyState.past.length > 0,
        canRedo: historyState.future.length > 0,
    };

    return (
        <TaskManagerContext.Provider value={contextValue}>
            {children}
        </TaskManagerContext.Provider>
    );
};

export const useTaskManager = () => {
    const context = useContext(TaskManagerContext);
    if (context === undefined) {
        throw new Error('useTaskManager must be used within a TaskManagerProvider');
    }
    return context;
};
