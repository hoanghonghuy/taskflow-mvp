"use strict";
/**
 * Cross-platform ID generator
 * Works in both web and React Native environments
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.generateShortId = generateShortId;
exports.generateUUID = generateUUID;
exports.generateTaskId = generateTaskId;
exports.generateListId = generateListId;
exports.generateHabitId = generateHabitId;
exports.generateEventId = generateEventId;
function generateId() {
    // Use timestamp + random string for uniqueness
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${randomStr}`;
}
function generateShortId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
// Generate UUID-like ID for better uniqueness
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
// Generate task-specific ID with prefix
function generateTaskId() {
    return `task_${generateId()}`;
}
function generateListId() {
    return `list_${generateId()}`;
}
function generateHabitId() {
    return `habit_${generateId()}`;
}
function generateEventId() {
    return `event_${generateId()}`;
}
