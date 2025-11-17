import type { Task, List, Habit, CountdownEvent, PomodoroState } from '../types';
export declare const setView: (view: any) => {
    type: "SET_VIEW";
    payload: any;
};
export declare const setSelectedTask: (taskId: string | null) => {
    type: "SET_SELECTED_TASK";
    payload: string | null;
};
export declare const setActiveList: (listId: string) => {
    type: "SET_ACTIVE_LIST";
    payload: string;
};
export declare const setActiveTag: (tag: string | null) => {
    type: "SET_ACTIVE_TAG";
    payload: string | null;
};
export declare const addTag: (name: string) => {
    type: "ADD_TAG";
    payload: {
        name: string;
    };
};
export declare const deleteTag: (tag: string) => {
    type: "DELETE_TAG";
    payload: string;
};
export declare const addTask: (task: Omit<Task, "id"> & {
    id?: string;
}) => {
    type: "ADD_TASK";
    payload: Omit<Task, "id"> & {
        id?: string;
    };
};
export declare const updateTask: (task: Task) => {
    type: "UPDATE_TASK";
    payload: Task;
};
export declare const deleteTask: (taskId: string) => {
    type: "DELETE_TASK";
    payload: string;
};
export declare const toggleTaskCompletion: (taskId: string) => {
    type: "TOGGLE_TASK_COMPLETION";
    payload: {
        taskId: string;
    };
};
export declare const assignTask: (taskId: string, userId: string | null) => {
    type: "ASSIGN_TASK";
    payload: {
        taskId: string;
        userId: string | null;
    };
};
export declare const addComment: (taskId: string, comment: any) => {
    type: "ADD_COMMENT";
    payload: {
        taskId: string;
        comment: any;
    };
};
export declare const addList: (list: Omit<List, "id">) => {
    type: "ADD_LIST";
    payload: Omit<List, "id">;
};
export declare const updateList: (list: List) => {
    type: "UPDATE_LIST";
    payload: List;
};
export declare const deleteList: (listId: string) => {
    type: "DELETE_LIST";
    payload: string;
};
export declare const shareList: (listId: string, userId: string) => {
    type: "SHARE_LIST";
    payload: {
        listId: string;
        userId: string;
    };
};
export declare const unshareList: (listId: string, userId: string) => {
    type: "UNSHARE_LIST";
    payload: {
        listId: string;
        userId: string;
    };
};
export declare const addColumn: (name: string, listId: string) => {
    type: "ADD_COLUMN";
    payload: {
        name: string;
        listId: string;
    };
};
export declare const updateColumn: (columnId: string, name: string) => {
    type: "UPDATE_COLUMN";
    payload: {
        columnId: string;
        name: string;
    };
};
export declare const deleteColumn: (columnId: string, listId: string) => {
    type: "DELETE_COLUMN";
    payload: {
        columnId: string;
        listId: string;
    };
};
export declare const moveTaskToColumn: (taskId: string, newColumnId: string, listId: string) => {
    type: "MOVE_TASK_TO_COLUMN";
    payload: {
        taskId: string;
        newColumnId: string;
        listId: string;
    };
};
export declare const reorderColumns: (listId: string, draggedId: string, droppedOnId: string) => {
    type: "REORDER_COLUMNS";
    payload: {
        listId: string;
        draggedId: string;
        droppedOnId: string;
    };
};
export declare const addHabit: (habit: Omit<Habit, "id" | "completions" | "createdAt">) => {
    type: "ADD_HABIT";
    payload: Omit<Habit, "id" | "createdAt" | "completions">;
};
export declare const updateHabit: (habit: Habit) => {
    type: "UPDATE_HABIT";
    payload: Habit;
};
export declare const deleteHabit: (habitId: string) => {
    type: "DELETE_HABIT";
    payload: string;
};
export declare const toggleHabitCompletion: (habitId: string, date: string) => {
    type: "TOGGLE_HABIT_COMPLETION";
    payload: {
        habitId: string;
        date: string;
    };
};
export declare const addCountdown: (event: CountdownEvent) => {
    type: "ADD_COUNTDOWN";
    payload: CountdownEvent;
};
export declare const updateCountdown: (event: CountdownEvent) => {
    type: "UPDATE_COUNTDOWN";
    payload: CountdownEvent;
};
export declare const deleteCountdown: (eventId: string) => {
    type: "DELETE_COUNTDOWN";
    payload: string;
};
export declare const startTimer: () => {
    type: "START_TIMER";
};
export declare const pauseTimer: () => {
    type: "PAUSE_TIMER";
};
export declare const resetTimer: () => {
    type: "RESET_TIMER";
};
export declare const tickTimer: () => {
    type: "TICK_TIMER";
};
export declare const setFocusedTask: (taskId: string | null) => {
    type: "SET_FOCUSED_TASK";
    payload: string | null;
};
export declare const completePomodoroSession: () => {
    type: "COMPLETE_POMODORO_SESSION";
};
export declare const updatePomodoroSettings: (settings: Partial<PomodoroState["settings"]>) => {
    type: "UPDATE_POMODORO_SETTINGS";
    payload: Partial<import("../types").PomodoroSettings>;
};
export declare const skipBreak: () => {
    type: "SKIP_BREAK";
};
export declare const setOnlineStatus: (isOnline: boolean) => {
    type: "SET_ONLINE_STATUS";
    payload: boolean;
};
export declare const setSyncState: (syncStatus: "synced" | "syncing" | "error") => {
    type: "SET_SYNC_STATE";
    payload: "synced" | "syncing" | "error";
};
export declare const backgroundTimerUpdate: (remainingTime: number, isActive: boolean) => {
    type: "BACKGROUND_TIMER_UPDATE";
    payload: {
        remainingTime: number;
        isActive: boolean;
    };
};
export declare const setNotificationPermissions: (hasPermission: boolean) => {
    type: "SET_NOTIFICATION_PERMISSIONS";
    payload: boolean;
};
export declare const addPendingChange: (change: {
    type: string;
    data: any;
}) => {
    type: "ADD_PENDING_CHANGE";
    payload: {
        type: string;
        data: any;
    };
};
export declare const clearPendingChanges: () => {
    type: "CLEAR_PENDING_CHANGES";
};
export declare const loadState: (state: any) => {
    type: "LOAD_STATE";
    payload: any;
};
export declare const resetState: () => {
    type: "RESET_STATE";
};
export declare const taskActions: {
    add: (task: Omit<Task, "id"> & {
        id?: string;
    }) => {
        type: "ADD_TASK";
        payload: Omit<Task, "id"> & {
            id?: string;
        };
    };
    update: (task: Task) => {
        type: "UPDATE_TASK";
        payload: Task;
    };
    delete: (taskId: string) => {
        type: "DELETE_TASK";
        payload: string;
    };
    toggleCompletion: (taskId: string) => {
        type: "TOGGLE_TASK_COMPLETION";
        payload: {
            taskId: string;
        };
    };
    assign: (taskId: string, userId: string | null) => {
        type: "ASSIGN_TASK";
        payload: {
            taskId: string;
            userId: string | null;
        };
    };
    addComment: (taskId: string, comment: any) => {
        type: "ADD_COMMENT";
        payload: {
            taskId: string;
            comment: any;
        };
    };
};
export declare const listActions: {
    add: (list: Omit<List, "id">) => {
        type: "ADD_LIST";
        payload: Omit<List, "id">;
    };
    update: (list: List) => {
        type: "UPDATE_LIST";
        payload: List;
    };
    delete: (listId: string) => {
        type: "DELETE_LIST";
        payload: string;
    };
    share: (listId: string, userId: string) => {
        type: "SHARE_LIST";
        payload: {
            listId: string;
            userId: string;
        };
    };
    unshare: (listId: string, userId: string) => {
        type: "UNSHARE_LIST";
        payload: {
            listId: string;
            userId: string;
        };
    };
};
export declare const boardActions: {
    addColumn: (name: string, listId: string) => {
        type: "ADD_COLUMN";
        payload: {
            name: string;
            listId: string;
        };
    };
    updateColumn: (columnId: string, name: string) => {
        type: "UPDATE_COLUMN";
        payload: {
            columnId: string;
            name: string;
        };
    };
    deleteColumn: (columnId: string, listId: string) => {
        type: "DELETE_COLUMN";
        payload: {
            columnId: string;
            listId: string;
        };
    };
    moveTask: (taskId: string, newColumnId: string, listId: string) => {
        type: "MOVE_TASK_TO_COLUMN";
        payload: {
            taskId: string;
            newColumnId: string;
            listId: string;
        };
    };
    reorderColumns: (listId: string, draggedId: string, droppedOnId: string) => {
        type: "REORDER_COLUMNS";
        payload: {
            listId: string;
            draggedId: string;
            droppedOnId: string;
        };
    };
};
export declare const habitActions: {
    add: (habit: Omit<Habit, "id" | "completions" | "createdAt">) => {
        type: "ADD_HABIT";
        payload: Omit<Habit, "id" | "createdAt" | "completions">;
    };
    update: (habit: Habit) => {
        type: "UPDATE_HABIT";
        payload: Habit;
    };
    delete: (habitId: string) => {
        type: "DELETE_HABIT";
        payload: string;
    };
    toggleCompletion: (habitId: string, date: string) => {
        type: "TOGGLE_HABIT_COMPLETION";
        payload: {
            habitId: string;
            date: string;
        };
    };
};
export declare const countdownActions: {
    add: (event: CountdownEvent) => {
        type: "ADD_COUNTDOWN";
        payload: CountdownEvent;
    };
    update: (event: CountdownEvent) => {
        type: "UPDATE_COUNTDOWN";
        payload: CountdownEvent;
    };
    delete: (eventId: string) => {
        type: "DELETE_COUNTDOWN";
        payload: string;
    };
};
export declare const pomodoroActions: {
    start: () => {
        type: "START_TIMER";
    };
    pause: () => {
        type: "PAUSE_TIMER";
    };
    reset: () => {
        type: "RESET_TIMER";
    };
    tick: () => {
        type: "TICK_TIMER";
    };
    setFocusedTask: (taskId: string | null) => {
        type: "SET_FOCUSED_TASK";
        payload: string | null;
    };
    completeSession: () => {
        type: "COMPLETE_POMODORO_SESSION";
    };
    updateSettings: (settings: Partial<PomodoroState["settings"]>) => {
        type: "UPDATE_POMODORO_SETTINGS";
        payload: Partial<import("../types").PomodoroSettings>;
    };
    skipBreak: () => {
        type: "SKIP_BREAK";
    };
};
export declare const mobileActions: {
    setOnlineStatus: (isOnline: boolean) => {
        type: "SET_ONLINE_STATUS";
        payload: boolean;
    };
    setSyncState: (syncStatus: "synced" | "syncing" | "error") => {
        type: "SET_SYNC_STATE";
        payload: "synced" | "syncing" | "error";
    };
    backgroundTimerUpdate: (remainingTime: number, isActive: boolean) => {
        type: "BACKGROUND_TIMER_UPDATE";
        payload: {
            remainingTime: number;
            isActive: boolean;
        };
    };
    setNotificationPermissions: (hasPermission: boolean) => {
        type: "SET_NOTIFICATION_PERMISSIONS";
        payload: boolean;
    };
    addPendingChange: (change: {
        type: string;
        data: any;
    }) => {
        type: "ADD_PENDING_CHANGE";
        payload: {
            type: string;
            data: any;
        };
    };
    clearPendingChanges: () => {
        type: "CLEAR_PENDING_CHANGES";
    };
};
export declare const navigationActions: {
    setView: (view: any) => {
        type: "SET_VIEW";
        payload: any;
    };
    setSelectedTask: (taskId: string | null) => {
        type: "SET_SELECTED_TASK";
        payload: string | null;
    };
    setActiveList: (listId: string) => {
        type: "SET_ACTIVE_LIST";
        payload: string;
    };
    setActiveTag: (tag: string | null) => {
        type: "SET_ACTIVE_TAG";
        payload: string | null;
    };
};
export declare const tagActions: {
    add: (name: string) => {
        type: "ADD_TAG";
        payload: {
            name: string;
        };
    };
    delete: (tag: string) => {
        type: "DELETE_TAG";
        payload: string;
    };
};
