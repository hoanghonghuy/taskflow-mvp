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
exports.countdownActions = exports.habitActions = exports.boardActions = exports.listActions = exports.taskActions = exports.resetState = exports.loadState = exports.clearPendingChanges = exports.addPendingChange = exports.setNotificationPermissions = exports.backgroundTimerUpdate = exports.setSyncState = exports.setOnlineStatus = exports.skipBreak = exports.updatePomodoroSettings = exports.completePomodoroSession = exports.setFocusedTask = exports.tickTimer = exports.resetTimer = exports.pauseTimer = exports.startTimer = exports.deleteCountdown = exports.updateCountdown = exports.addCountdown = exports.toggleHabitCompletion = exports.deleteHabit = exports.updateHabit = exports.addHabit = exports.reorderColumns = exports.moveTaskToColumn = exports.deleteColumn = exports.updateColumn = exports.addColumn = exports.unshareList = exports.shareList = exports.deleteList = exports.updateList = exports.addList = exports.addComment = exports.assignTask = exports.toggleTaskCompletion = exports.deleteTask = exports.updateTask = exports.addTask = exports.deleteTag = exports.addTag = exports.setActiveTag = exports.setActiveList = exports.setSelectedTask = exports.setView = void 0;
exports.tagActions = exports.navigationActions = exports.mobileActions = exports.pomodoroActions = void 0;
const ActionTypes = __importStar(require("./action-types"));
// View and navigation actions
const setView = (view) => ({ type: ActionTypes.SET_VIEW, payload: view });
exports.setView = setView;
const setSelectedTask = (taskId) => ({ type: ActionTypes.SET_SELECTED_TASK, payload: taskId });
exports.setSelectedTask = setSelectedTask;
const setActiveList = (listId) => ({ type: ActionTypes.SET_ACTIVE_LIST, payload: listId });
exports.setActiveList = setActiveList;
const setActiveTag = (tag) => ({ type: ActionTypes.SET_ACTIVE_TAG, payload: tag });
exports.setActiveTag = setActiveTag;
// Tag actions
const addTag = (name) => ({ type: ActionTypes.ADD_TAG, payload: { name } });
exports.addTag = addTag;
const deleteTag = (tag) => ({ type: ActionTypes.DELETE_TAG, payload: tag });
exports.deleteTag = deleteTag;
// Task actions
const addTask = (task) => ({ type: ActionTypes.ADD_TASK, payload: task });
exports.addTask = addTask;
const updateTask = (task) => ({ type: ActionTypes.UPDATE_TASK, payload: task });
exports.updateTask = updateTask;
const deleteTask = (taskId) => ({ type: ActionTypes.DELETE_TASK, payload: taskId });
exports.deleteTask = deleteTask;
const toggleTaskCompletion = (taskId) => ({ type: ActionTypes.TOGGLE_TASK_COMPLETION, payload: { taskId } });
exports.toggleTaskCompletion = toggleTaskCompletion;
const assignTask = (taskId, userId) => ({ type: ActionTypes.ASSIGN_TASK, payload: { taskId, userId } });
exports.assignTask = assignTask;
const addComment = (taskId, comment) => ({ type: ActionTypes.ADD_COMMENT, payload: { taskId, comment } });
exports.addComment = addComment;
// List actions
const addList = (list) => ({ type: ActionTypes.ADD_LIST, payload: list });
exports.addList = addList;
const updateList = (list) => ({ type: ActionTypes.UPDATE_LIST, payload: list });
exports.updateList = updateList;
const deleteList = (listId) => ({ type: ActionTypes.DELETE_LIST, payload: listId });
exports.deleteList = deleteList;
const shareList = (listId, userId) => ({ type: ActionTypes.SHARE_LIST, payload: { listId, userId } });
exports.shareList = shareList;
const unshareList = (listId, userId) => ({ type: ActionTypes.UNSHARE_LIST, payload: { listId, userId } });
exports.unshareList = unshareList;
// Column actions
const addColumn = (name, listId) => ({ type: ActionTypes.ADD_COLUMN, payload: { name, listId } });
exports.addColumn = addColumn;
const updateColumn = (columnId, name) => ({ type: ActionTypes.UPDATE_COLUMN, payload: { columnId, name } });
exports.updateColumn = updateColumn;
const deleteColumn = (columnId, listId) => ({ type: ActionTypes.DELETE_COLUMN, payload: { columnId, listId } });
exports.deleteColumn = deleteColumn;
const moveTaskToColumn = (taskId, newColumnId, listId) => ({ type: ActionTypes.MOVE_TASK_TO_COLUMN, payload: { taskId, newColumnId, listId } });
exports.moveTaskToColumn = moveTaskToColumn;
const reorderColumns = (listId, draggedId, droppedOnId) => ({ type: ActionTypes.REORDER_COLUMNS, payload: { listId, draggedId, droppedOnId } });
exports.reorderColumns = reorderColumns;
// Habit actions
const addHabit = (habit) => ({ type: ActionTypes.ADD_HABIT, payload: habit });
exports.addHabit = addHabit;
const updateHabit = (habit) => ({ type: ActionTypes.UPDATE_HABIT, payload: habit });
exports.updateHabit = updateHabit;
const deleteHabit = (habitId) => ({ type: ActionTypes.DELETE_HABIT, payload: habitId });
exports.deleteHabit = deleteHabit;
const toggleHabitCompletion = (habitId, date) => ({ type: ActionTypes.TOGGLE_HABIT_COMPLETION, payload: { habitId, date } });
exports.toggleHabitCompletion = toggleHabitCompletion;
// Countdown actions
const addCountdown = (event) => ({ type: ActionTypes.ADD_COUNTDOWN, payload: event });
exports.addCountdown = addCountdown;
const updateCountdown = (event) => ({ type: ActionTypes.UPDATE_COUNTDOWN, payload: event });
exports.updateCountdown = updateCountdown;
const deleteCountdown = (eventId) => ({ type: ActionTypes.DELETE_COUNTDOWN, payload: eventId });
exports.deleteCountdown = deleteCountdown;
// Pomodoro actions
const startTimer = () => ({ type: ActionTypes.START_TIMER });
exports.startTimer = startTimer;
const pauseTimer = () => ({ type: ActionTypes.PAUSE_TIMER });
exports.pauseTimer = pauseTimer;
const resetTimer = () => ({ type: ActionTypes.RESET_TIMER });
exports.resetTimer = resetTimer;
const tickTimer = () => ({ type: ActionTypes.TICK_TIMER });
exports.tickTimer = tickTimer;
const setFocusedTask = (taskId) => ({ type: ActionTypes.SET_FOCUSED_TASK, payload: taskId });
exports.setFocusedTask = setFocusedTask;
const completePomodoroSession = () => ({ type: ActionTypes.COMPLETE_POMODORO_SESSION });
exports.completePomodoroSession = completePomodoroSession;
const updatePomodoroSettings = (settings) => ({ type: ActionTypes.UPDATE_POMODORO_SETTINGS, payload: settings });
exports.updatePomodoroSettings = updatePomodoroSettings;
const skipBreak = () => ({ type: ActionTypes.SKIP_BREAK });
exports.skipBreak = skipBreak;
// Mobile-specific actions
const setOnlineStatus = (isOnline) => ({ type: ActionTypes.SET_ONLINE_STATUS, payload: isOnline });
exports.setOnlineStatus = setOnlineStatus;
const setSyncState = (syncStatus) => ({ type: ActionTypes.SET_SYNC_STATE, payload: syncStatus });
exports.setSyncState = setSyncState;
const backgroundTimerUpdate = (remainingTime, isActive) => ({ type: ActionTypes.BACKGROUND_TIMER_UPDATE, payload: { remainingTime, isActive } });
exports.backgroundTimerUpdate = backgroundTimerUpdate;
const setNotificationPermissions = (hasPermission) => ({ type: ActionTypes.SET_NOTIFICATION_PERMISSIONS, payload: hasPermission });
exports.setNotificationPermissions = setNotificationPermissions;
const addPendingChange = (change) => ({ type: ActionTypes.ADD_PENDING_CHANGE, payload: change });
exports.addPendingChange = addPendingChange;
const clearPendingChanges = () => ({ type: ActionTypes.CLEAR_PENDING_CHANGES });
exports.clearPendingChanges = clearPendingChanges;
// State management
const loadState = (state) => ({ type: ActionTypes.LOAD_STATE, payload: state });
exports.loadState = loadState;
const resetState = () => ({ type: ActionTypes.RESET_STATE });
exports.resetState = resetState;
// Action creators grouped by domain
exports.taskActions = {
    add: exports.addTask,
    update: exports.updateTask,
    delete: exports.deleteTask,
    toggleCompletion: exports.toggleTaskCompletion,
    assign: exports.assignTask,
    addComment: exports.addComment,
};
exports.listActions = {
    add: exports.addList,
    update: exports.updateList,
    delete: exports.deleteList,
    share: exports.shareList,
    unshare: exports.unshareList,
};
exports.boardActions = {
    addColumn: exports.addColumn,
    updateColumn: exports.updateColumn,
    deleteColumn: exports.deleteColumn,
    moveTask: exports.moveTaskToColumn,
    reorderColumns: exports.reorderColumns,
};
exports.habitActions = {
    add: exports.addHabit,
    update: exports.updateHabit,
    delete: exports.deleteHabit,
    toggleCompletion: exports.toggleHabitCompletion,
};
exports.countdownActions = {
    add: exports.addCountdown,
    update: exports.updateCountdown,
    delete: exports.deleteCountdown,
};
exports.pomodoroActions = {
    start: exports.startTimer,
    pause: exports.pauseTimer,
    reset: exports.resetTimer,
    tick: exports.tickTimer,
    setFocusedTask: exports.setFocusedTask,
    completeSession: exports.completePomodoroSession,
    updateSettings: exports.updatePomodoroSettings,
    skipBreak: exports.skipBreak,
};
exports.mobileActions = {
    setOnlineStatus: exports.setOnlineStatus,
    setSyncState: exports.setSyncState,
    backgroundTimerUpdate: exports.backgroundTimerUpdate,
    setNotificationPermissions: exports.setNotificationPermissions,
    addPendingChange: exports.addPendingChange,
    clearPendingChanges: exports.clearPendingChanges,
};
exports.navigationActions = {
    setView: exports.setView,
    setSelectedTask: exports.setSelectedTask,
    setActiveList: exports.setActiveList,
    setActiveTag: exports.setActiveTag,
};
exports.tagActions = {
    add: exports.addTag,
    delete: exports.deleteTag,
};
