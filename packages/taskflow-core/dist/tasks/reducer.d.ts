import type { AppState, Task, List, Habit, CountdownEvent, PomodoroState } from '../types';
import * as ActionTypes from './action-types';
export type Action = {
    type: typeof ActionTypes.SET_VIEW;
    payload: AppState['view'];
} | {
    type: typeof ActionTypes.SET_SELECTED_TASK;
    payload: string | null;
} | {
    type: typeof ActionTypes.SET_ACTIVE_LIST;
    payload: string;
} | {
    type: typeof ActionTypes.SET_ACTIVE_TAG;
    payload: string | null;
} | {
    type: typeof ActionTypes.ADD_TAG;
    payload: {
        name: string;
    };
} | {
    type: typeof ActionTypes.DELETE_TAG;
    payload: string;
} | {
    type: typeof ActionTypes.ADD_TASK;
    payload: Omit<Task, 'id'> & {
        id?: string;
    };
} | {
    type: typeof ActionTypes.UPDATE_TASK;
    payload: Task;
} | {
    type: typeof ActionTypes.DELETE_TASK;
    payload: string;
} | {
    type: typeof ActionTypes.TOGGLE_TASK_COMPLETION;
    payload: {
        taskId: string;
    };
} | {
    type: typeof ActionTypes.ASSIGN_TASK;
    payload: {
        taskId: string;
        userId: string | null;
    };
} | {
    type: typeof ActionTypes.ADD_COMMENT;
    payload: {
        taskId: string;
        comment: any;
    };
} | {
    type: typeof ActionTypes.ADD_LIST;
    payload: Omit<List, 'id'>;
} | {
    type: typeof ActionTypes.UPDATE_LIST;
    payload: List;
} | {
    type: typeof ActionTypes.DELETE_LIST;
    payload: string;
} | {
    type: typeof ActionTypes.SHARE_LIST;
    payload: {
        listId: string;
        userId: string;
    };
} | {
    type: typeof ActionTypes.UNSHARE_LIST;
    payload: {
        listId: string;
        userId: string;
    };
} | {
    type: typeof ActionTypes.ADD_COLUMN;
    payload: {
        name: string;
        listId: string;
    };
} | {
    type: typeof ActionTypes.UPDATE_COLUMN;
    payload: {
        columnId: string;
        name: string;
    };
} | {
    type: typeof ActionTypes.DELETE_COLUMN;
    payload: {
        columnId: string;
        listId: string;
    };
} | {
    type: typeof ActionTypes.MOVE_TASK_TO_COLUMN;
    payload: {
        taskId: string;
        newColumnId: string;
        listId: string;
    };
} | {
    type: typeof ActionTypes.REORDER_COLUMNS;
    payload: {
        listId: string;
        draggedId: string;
        droppedOnId: string;
    };
} | {
    type: typeof ActionTypes.ADD_HABIT;
    payload: Omit<Habit, 'id' | 'completions' | 'createdAt'>;
} | {
    type: typeof ActionTypes.UPDATE_HABIT;
    payload: Habit;
} | {
    type: typeof ActionTypes.DELETE_HABIT;
    payload: string;
} | {
    type: typeof ActionTypes.TOGGLE_HABIT_COMPLETION;
    payload: {
        habitId: string;
        date: string;
    };
} | {
    type: typeof ActionTypes.ADD_COUNTDOWN;
    payload: CountdownEvent;
} | {
    type: typeof ActionTypes.UPDATE_COUNTDOWN;
    payload: CountdownEvent;
} | {
    type: typeof ActionTypes.DELETE_COUNTDOWN;
    payload: string;
} | {
    type: typeof ActionTypes.START_TIMER;
} | {
    type: typeof ActionTypes.PAUSE_TIMER;
} | {
    type: typeof ActionTypes.RESET_TIMER;
} | {
    type: typeof ActionTypes.TICK_TIMER;
} | {
    type: typeof ActionTypes.SET_FOCUSED_TASK;
    payload: string | null;
} | {
    type: typeof ActionTypes.COMPLETE_POMODORO_SESSION;
} | {
    type: typeof ActionTypes.UPDATE_POMODORO_SETTINGS;
    payload: Partial<PomodoroState['settings']>;
} | {
    type: typeof ActionTypes.SKIP_BREAK;
} | {
    type: typeof ActionTypes.SET_ONLINE_STATUS;
    payload: boolean;
} | {
    type: typeof ActionTypes.SET_SYNC_STATE;
    payload: AppState['syncStatus'];
} | {
    type: typeof ActionTypes.BACKGROUND_TIMER_UPDATE;
    payload: {
        remainingTime: number;
        isActive: boolean;
    };
} | {
    type: typeof ActionTypes.SET_NOTIFICATION_PERMISSIONS;
    payload: boolean;
} | {
    type: typeof ActionTypes.ADD_PENDING_CHANGE;
    payload: {
        type: string;
        data: any;
    };
} | {
    type: typeof ActionTypes.CLEAR_PENDING_CHANGES;
} | {
    type: typeof ActionTypes.LOAD_STATE;
    payload: AppState;
} | {
    type: typeof ActionTypes.RESET_STATE;
};
export declare function taskManagerReducer(state: AppState, action: Action): AppState;
export declare function getInitialState(): AppState;
