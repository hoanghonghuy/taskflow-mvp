/**
 * Storage abstraction layer for cross-platform compatibility
 * Web: localStorage
 * Mobile: AsyncStorage
 */
export interface StorageAdapter {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    getAllKeys(): Promise<string[]>;
}
export declare class WebStorageAdapter implements StorageAdapter {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    getAllKeys(): Promise<string[]>;
}
export declare class MobileStorageAdapter implements StorageAdapter {
    private asyncStorage;
    constructor(asyncStorage: any);
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    getAllKeys(): Promise<string[]>;
}
export declare class StorageService {
    private adapter;
    constructor(adapter: StorageAdapter);
    get<T>(key: string, defaultValue?: T): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
    getMultiple<T>(keys: string[]): Promise<Record<string, T | null>>;
    setMultiple(items: Record<string, any>): Promise<void>;
}
export declare const STORAGE_KEYS: {
    readonly TASKS: "taskflow_tasks";
    readonly LISTS: "taskflow_lists";
    readonly COLUMNS: "taskflow_columns";
    readonly HABITS: "taskflow_habits";
    readonly COUNTDOWN_EVENTS: "taskflow_countdown_events";
    readonly POMODORO_STATE: "taskflow_pomodoro_state";
    readonly SETTINGS: "taskflow_settings";
    readonly USER_PREFERENCES: "taskflow_user_preferences";
    readonly SYNC_STATE: "taskflow_sync_state";
};
