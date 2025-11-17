"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskManagerReducer = taskManagerReducer;
exports.getInitialState = getInitialState;
const id_generator_1 = require("../utils/id-generator");
const ActionTypes = __importStar(require("./action-types"));
function taskManagerReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_VIEW:
            return { ...state, view: action.payload };
        case ActionTypes.SET_SELECTED_TASK:
            return { ...state, selectedTaskId: action.payload };
        case ActionTypes.SET_ACTIVE_LIST:
            return {
                ...state,
                activeListId: action.payload,
                activeTag: null,
                selectedTaskId: null,
                view: 'list'
            };
        case ActionTypes.SET_ACTIVE_TAG:
            return {
                ...state,
                activeTag: action.payload,
                activeListId: 'inbox',
                selectedTaskId: null,
                view: 'list'
            };
        case ActionTypes.ADD_TAG: {
            const newTagName = action.payload.name.trim().toLowerCase();
            if (newTagName && !state.tags.includes(newTagName)) {
                return { ...state, tags: [...state.tags, newTagName] };
            }
            return state;
        }
        case ActionTypes.DELETE_TAG: {
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
        case ActionTypes.ADD_TASK: {
            const newTask = {
                ...action.payload,
                id: action.payload.id || (0, id_generator_1.generateTaskId)(),
                createdAt: action.payload.createdAt || new Date().toISOString()
            };
            return { ...state, tasks: [...state.tasks, newTask] };
        }
        case ActionTypes.UPDATE_TASK:
            return {
                ...state,
                tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t)
            };
        case ActionTypes.DELETE_TASK:
            return {
                ...state,
                tasks: state.tasks.filter(t => t.id !== action.payload),
                selectedTaskId: state.selectedTaskId === action.payload ? null : state.selectedTaskId
            };
        case ActionTypes.TOGGLE_TASK_COMPLETION: {
            const { taskId } = action.payload;
            return {
                ...state,
                tasks: state.tasks.map(t => {
                    if (t.id === taskId) {
                        const isCompleting = !t.completed;
                        return {
                            ...t,
                            completed: isCompleting,
                            completedAt: isCompleting ? new Date().toISOString() : undefined
                        };
                    }
                    return t;
                })
            };
        }
        case ActionTypes.ADD_LIST: {
            const newList = {
                ...action.payload,
                id: (0, id_generator_1.generateListId)()
            };
            return { ...state, lists: [...state.lists, newList] };
        }
        case ActionTypes.UPDATE_LIST:
            return {
                ...state,
                lists: state.lists.map(l => l.id === action.payload.id ? action.payload : l)
            };
        case ActionTypes.DELETE_LIST:
            return {
                ...state,
                lists: state.lists.filter(l => l.id !== action.payload),
                tasks: state.tasks.filter(t => t.listId !== action.payload),
                columns: state.columns.filter(c => c.listId !== action.payload)
            };
        case ActionTypes.ADD_COLUMN: {
            const newColumn = {
                id: generateId(),
                name: action.payload.name,
                listId: action.payload.listId,
            };
            return { ...state, columns: [...state.columns, newColumn] };
        }
        case ActionTypes.UPDATE_COLUMN:
            return {
                ...state,
                columns: state.columns.map(c => c.id === action.payload.columnId ? { ...c, name: action.payload.name } : c)
            };
        case ActionTypes.DELETE_COLUMN: {
            const { columnId, listId } = action.payload;
            const columnsForList = state.columns.filter(c => c.listId === listId);
            const firstColumnId = columnsForList[0]?.id;
            return {
                ...state,
                columns: state.columns.filter(c => c.id !== columnId),
                tasks: state.tasks.map(t => t.columnId === columnId ? { ...t, columnId: firstColumnId } : t)
            };
        }
        case ActionTypes.MOVE_TASK_TO_COLUMN:
            return {
                ...state,
                tasks: state.tasks.map(t => t.id === action.payload.taskId
                    ? { ...t, columnId: action.payload.newColumnId, listId: action.payload.listId }
                    : t)
            };
        case ActionTypes.REORDER_COLUMNS: {
            const { listId, draggedId, droppedOnId } = action.payload;
            const columnsForList = state.columns.filter(c => c.listId === listId);
            const otherColumns = state.columns.filter(c => c.listId !== listId);
            const draggedIndex = columnsForList.findIndex(c => c.id === draggedId);
            const droppedIndex = columnsForList.findIndex(c => c.id === droppedOnId);
            if (draggedIndex === -1 || droppedIndex === -1)
                return state;
            const reordered = [...columnsForList];
            const [draggedColumn] = reordered.splice(draggedIndex, 1);
            reordered.splice(droppedIndex, 0, draggedColumn);
            return { ...state, columns: [...otherColumns, ...reordered] };
        }
        case ActionTypes.ADD_HABIT: {
            const newHabit = {
                ...action.payload,
                id: (0, id_generator_1.generateHabitId)(),
                completions: [],
                createdAt: new Date().toISOString(),
                streak: 0,
                bestStreak: 0,
            };
            return { ...state, habits: [...state.habits, newHabit] };
        }
        case ActionTypes.UPDATE_HABIT:
            return {
                ...state,
                habits: state.habits.map(h => h.id === action.payload.id ? action.payload : h)
            };
        case ActionTypes.DELETE_HABIT:
            return { ...state, habits: state.habits.filter(h => h.id !== action.payload) };
        case ActionTypes.TOGGLE_HABIT_COMPLETION: {
            const { habitId, date } = action.payload;
            return {
                ...state,
                habits: state.habits.map(h => {
                    if (h.id !== habitId)
                        return h;
                    const completions = h.completions.includes(date)
                        ? h.completions.filter(d => d !== date)
                        : [...h.completions, date];
                    // Calculate streak - convert completions to string array
                    const completionsAsStrings = completions.map(d => d instanceof Date ? d.toISOString() : d);
                    const today = new Date();
                    const streak = calculateStreak(completionsAsStrings, today);
                    const bestStreak = Math.max(h.bestStreak || 0, streak);
                    return { ...h, completions, streak, bestStreak };
                })
            };
        }
        case ActionTypes.ADD_COUNTDOWN: {
            const newEvent = {
                ...action.payload,
                id: action.payload.id || (0, id_generator_1.generateEventId)(),
                createdAt: action.payload.createdAt || new Date().toISOString()
            };
            return { ...state, countdownEvents: [...state.countdownEvents, newEvent] };
        }
        case ActionTypes.UPDATE_COUNTDOWN:
            return {
                ...state,
                countdownEvents: state.countdownEvents.map(e => e.id === action.payload.id ? action.payload : e)
            };
        case ActionTypes.DELETE_COUNTDOWN:
            return {
                ...state,
                countdownEvents: state.countdownEvents.filter(e => e.id !== action.payload)
            };
        case ActionTypes.START_TIMER:
            return {
                ...state,
                pomodoro: {
                    ...state.pomodoro,
                    isActive: true,
                    isPaused: false,
                    sessionStartTime: new Date().toISOString()
                }
            };
        case ActionTypes.PAUSE_TIMER:
            return {
                ...state,
                pomodoro: { ...state.pomodoro, isPaused: true }
            };
        case ActionTypes.RESET_TIMER: {
            const { currentSession, settings } = state.pomodoro;
            const duration = currentSession === 'focus'
                ? settings.focusDuration
                : currentSession === 'shortBreak'
                    ? settings.shortBreakDuration
                    : settings.longBreakDuration;
            return {
                ...state,
                pomodoro: {
                    ...state.pomodoro,
                    isActive: false,
                    isPaused: false,
                    remainingTime: duration * 60,
                    sessionStartTime: undefined,
                }
            };
        }
        case ActionTypes.TICK_TIMER: {
            if (!state.pomodoro.isActive || state.pomodoro.isPaused)
                return state;
            const newRemainingTime = Math.max(0, state.pomodoro.remainingTime - 1);
            if (newRemainingTime === 0) {
                return taskManagerReducer(state, { type: ActionTypes.COMPLETE_POMODORO_SESSION });
            }
            return { ...state, pomodoro: { ...state.pomodoro, remainingTime: newRemainingTime } };
        }
        case ActionTypes.SET_FOCUSED_TASK:
            return {
                ...state,
                pomodoro: { ...state.pomodoro, focusedTaskId: action.payload }
            };
        case ActionTypes.COMPLETE_POMODORO_SESSION: {
            const { currentSession, sessionsCompleted, settings, focusedTaskId } = state.pomodoro;
            let nextSession;
            let newSessionsCompleted = sessionsCompleted;
            if (currentSession === 'focus') {
                newSessionsCompleted++;
                nextSession = (newSessionsCompleted % settings.sessionsUntilLongBreak === 0)
                    ? 'longBreak' : 'shortBreak';
                if (focusedTaskId) {
                    const focusHistory = [
                        ...state.pomodoro.focusHistory,
                        {
                            startTime: state.pomodoro.sessionStartTime || new Date().toISOString(),
                            duration: settings.focusDuration * 60,
                            taskId: focusedTaskId,
                        }
                    ];
                    return {
                        ...state,
                        pomodoro: {
                            ...state.pomodoro,
                            currentSession: nextSession,
                            sessionsCompleted: newSessionsCompleted,
                            remainingTime: (nextSession === 'longBreak' ? settings.longBreakDuration : settings.shortBreakDuration) * 60,
                            isActive: false,
                            focusHistory,
                            sessionStartTime: undefined,
                        }
                    };
                }
            }
            else {
                nextSession = 'focus';
            }
            return {
                ...state,
                pomodoro: {
                    ...state.pomodoro,
                    currentSession: nextSession,
                    sessionsCompleted: newSessionsCompleted,
                    remainingTime: (nextSession === 'focus' ? settings.focusDuration : settings.shortBreakDuration) * 60,
                    isActive: false,
                    sessionStartTime: undefined,
                }
            };
        }
        case ActionTypes.SKIP_BREAK: {
            const { currentSession, settings } = state.pomodoro;
            if (currentSession === 'focus')
                return state; // Can't skip focus session
            return {
                ...state,
                pomodoro: {
                    ...state.pomodoro,
                    currentSession: 'focus',
                    remainingTime: settings.focusDuration * 60,
                    isActive: false,
                    sessionStartTime: undefined,
                }
            };
        }
        case ActionTypes.UPDATE_POMODORO_SETTINGS:
            return {
                ...state,
                pomodoro: {
                    ...state.pomodoro,
                    settings: { ...state.pomodoro.settings, ...action.payload }
                }
            };
        case ActionTypes.ASSIGN_TASK:
            return {
                ...state,
                tasks: state.tasks.map(t => t.id === action.payload.taskId ? { ...t, assigneeId: action.payload.userId } : t)
            };
        case ActionTypes.ADD_COMMENT:
            return {
                ...state,
                tasks: state.tasks.map(t => t.id === action.payload.taskId
                    ? { ...t, comments: [...(t.comments || []), action.payload.comment] }
                    : t)
            };
        case ActionTypes.SHARE_LIST:
            return {
                ...state,
                lists: state.lists.map(l => l.id === action.payload.listId
                    ? { ...l, members: [...l.members, action.payload.userId] }
                    : l)
            };
        case ActionTypes.UNSHARE_LIST:
            return {
                ...state,
                lists: state.lists.map(l => l.id === action.payload.listId
                    ? { ...l, members: l.members.filter(id => id !== action.payload.userId) }
                    : l)
            };
        // Mobile-specific actions
        case ActionTypes.SET_ONLINE_STATUS:
            return { ...state, isOnline: action.payload };
        case ActionTypes.SET_SYNC_STATE:
            return {
                ...state,
                syncStatus: action.payload,
                lastSyncTime: action.payload === 'synced' ? new Date() : state.lastSyncTime
            };
        case ActionTypes.BACKGROUND_TIMER_UPDATE:
            return {
                ...state,
                pomodoro: {
                    ...state.pomodoro,
                    remainingTime: action.payload.remainingTime,
                    isActive: action.payload.isActive,
                    backgroundMode: true,
                }
            };
        case ActionTypes.SET_NOTIFICATION_PERMISSIONS:
            return { ...state, notificationPermissions: action.payload };
        case ActionTypes.ADD_PENDING_CHANGE:
            return {
                ...state,
                pendingChanges: (state.pendingChanges || 0) + 1
            };
        case ActionTypes.CLEAR_PENDING_CHANGES:
            return {
                ...state,
                pendingChanges: 0
            };
        case ActionTypes.LOAD_STATE:
            return action.payload;
        case ActionTypes.RESET_STATE:
            return getInitialState();
        default:
            return state;
    }
}
// Helper functions
function generateId() {
    return Math.random().toString(36).substring(2, 15);
}
function calculateStreak(completions, today) {
    if (completions.length === 0)
        return 0;
    const sortedDates = completions
        .map(date => new Date(date))
        .sort((a, b) => b.getTime() - a.getTime());
    let streak = 0;
    let currentDate = new Date(today);
    currentDate.setHours(0, 0, 0, 0);
    for (const completionDate of sortedDates) {
        const compDate = new Date(completionDate);
        compDate.setHours(0, 0, 0, 0);
        if (compDate.getTime() === currentDate.getTime()) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }
        else if (compDate.getTime() < currentDate.getTime()) {
            break;
        }
    }
    return streak;
}
// Initial state
function getInitialState() {
    return {
        view: 'dashboard',
        tasks: [],
        lists: [],
        columns: [],
        habits: [],
        countdownEvents: [],
        selectedTaskId: null,
        activeListId: 'inbox',
        activeTag: null,
        tags: [],
        pomodoro: {
            isActive: false,
            isPaused: false,
            remainingTime: 25 * 60, // 25 minutes default
            currentSession: 'focus',
            focusedTaskId: null,
            sessionsCompleted: 0,
            focusHistory: [],
            settings: {
                focusDuration: 25,
                shortBreakDuration: 5,
                longBreakDuration: 15,
                sessionsUntilLongBreak: 4,
                autoStartBreaks: false,
                autoStartPomodoro: false,
                tickSound: false,
                completionSound: true,
                vibration: true,
                notificationSound: 'default',
                keepScreenOn: false,
            },
            backgroundMode: false,
            notificationPermission: false,
        },
        unlockedAchievements: [],
        sortOrder: 'default',
        // Mobile-specific initial state
        isOnline: true,
        syncStatus: 'synced',
        notificationPermissions: false,
        pendingChanges: 0,
    };
}
