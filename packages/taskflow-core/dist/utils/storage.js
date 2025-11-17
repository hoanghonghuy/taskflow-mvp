"use strict";
/**
 * Storage abstraction layer for cross-platform compatibility
 * Web: localStorage
 * Mobile: AsyncStorage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_KEYS = exports.StorageService = exports.MobileStorageAdapter = exports.WebStorageAdapter = void 0;
// Web implementation using localStorage
class WebStorageAdapter {
    async getItem(key) {
        try {
            return localStorage.getItem(key);
        }
        catch (error) {
            console.warn('localStorage getItem error:', error);
            return null;
        }
    }
    async setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        }
        catch (error) {
            console.warn('localStorage setItem error:', error);
        }
    }
    async removeItem(key) {
        try {
            localStorage.removeItem(key);
        }
        catch (error) {
            console.warn('localStorage removeItem error:', error);
        }
    }
    async clear() {
        try {
            localStorage.clear();
        }
        catch (error) {
            console.warn('localStorage clear error:', error);
        }
    }
    async getAllKeys() {
        try {
            return Object.keys(localStorage);
        }
        catch (error) {
            console.warn('localStorage getAllKeys error:', error);
            return [];
        }
    }
}
exports.WebStorageAdapter = WebStorageAdapter;
// Mobile implementation using AsyncStorage (placeholder - will be implemented in mobile package)
class MobileStorageAdapter {
    constructor(asyncStorage) {
        this.asyncStorage = asyncStorage;
    }
    async getItem(key) {
        try {
            return await this.asyncStorage.getItem(key);
        }
        catch (error) {
            console.warn('AsyncStorage getItem error:', error);
            return null;
        }
    }
    async setItem(key, value) {
        try {
            await this.asyncStorage.setItem(key, value);
        }
        catch (error) {
            console.warn('AsyncStorage setItem error:', error);
        }
    }
    async removeItem(key) {
        try {
            await this.asyncStorage.removeItem(key);
        }
        catch (error) {
            console.warn('AsyncStorage removeItem error:', error);
        }
    }
    async clear() {
        try {
            await this.asyncStorage.clear();
        }
        catch (error) {
            console.warn('AsyncStorage clear error:', error);
        }
    }
    async getAllKeys() {
        try {
            return await this.asyncStorage.getAllKeys();
        }
        catch (error) {
            console.warn('AsyncStorage getAllKeys error:', error);
            return [];
        }
    }
}
exports.MobileStorageAdapter = MobileStorageAdapter;
// Storage service with common operations
class StorageService {
    constructor(adapter) {
        this.adapter = adapter;
    }
    // Generic get/set with JSON serialization
    async get(key, defaultValue) {
        const value = await this.adapter.getItem(key);
        if (!value)
            return defaultValue || null;
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    async set(key, value) {
        await this.adapter.setItem(key, JSON.stringify(value));
    }
    async remove(key) {
        await this.adapter.removeItem(key);
    }
    async clear() {
        await this.adapter.clear();
    }
    // Batch operations
    async getMultiple(keys) {
        const result = {};
        for (const key of keys) {
            result[key] = await this.get(key);
        }
        return result;
    }
    async setMultiple(items) {
        for (const [key, value] of Object.entries(items)) {
            await this.set(key, value);
        }
    }
}
exports.StorageService = StorageService;
// Storage keys constants
exports.STORAGE_KEYS = {
    TASKS: 'taskflow_tasks',
    LISTS: 'taskflow_lists',
    COLUMNS: 'taskflow_columns',
    HABITS: 'taskflow_habits',
    COUNTDOWN_EVENTS: 'taskflow_countdown_events',
    POMODORO_STATE: 'taskflow_pomodoro_state',
    SETTINGS: 'taskflow_settings',
    USER_PREFERENCES: 'taskflow_user_preferences',
    SYNC_STATE: 'taskflow_sync_state',
};
