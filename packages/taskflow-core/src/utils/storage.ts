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

// Web implementation using localStorage
export class WebStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage setItem error:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage removeItem error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('localStorage clear error:', error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.warn('localStorage getAllKeys error:', error);
      return [];
    }
  }
}

// Mobile implementation using AsyncStorage (placeholder - will be implemented in mobile package)
export class MobileStorageAdapter implements StorageAdapter {
  private asyncStorage: any; // Will be injected from mobile package

  constructor(asyncStorage: any) {
    this.asyncStorage = asyncStorage;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await this.asyncStorage.getItem(key);
    } catch (error) {
      console.warn('AsyncStorage getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.asyncStorage.setItem(key, value);
    } catch (error) {
      console.warn('AsyncStorage setItem error:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.asyncStorage.removeItem(key);
    } catch (error) {
      console.warn('AsyncStorage removeItem error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.asyncStorage.clear();
    } catch (error) {
      console.warn('AsyncStorage clear error:', error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await this.asyncStorage.getAllKeys();
    } catch (error) {
      console.warn('AsyncStorage getAllKeys error:', error);
      return [];
    }
  }
}

// Storage service with common operations
export class StorageService {
  private adapter: StorageAdapter;

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
  }

  // Generic get/set with JSON serialization
  async get<T>(key: string, defaultValue?: T): Promise<T | null> {
    const value = await this.adapter.getItem(key);
    if (!value) return defaultValue || null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value as unknown as T;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.adapter.setItem(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    await this.adapter.removeItem(key);
  }

  async clear(): Promise<void> {
    await this.adapter.clear();
  }

  // Batch operations
  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};
    
    for (const key of keys) {
      result[key] = await this.get<T>(key);
    }
    
    return result;
  }

  async setMultiple(items: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      await this.set(key, value);
    }
  }
}

// Storage keys constants
export const STORAGE_KEYS = {
  TASKS: 'taskflow_tasks',
  LISTS: 'taskflow_lists',
  COLUMNS: 'taskflow_columns',
  HABITS: 'taskflow_habits',
  COUNTDOWN_EVENTS: 'taskflow_countdown_events',
  POMODORO_STATE: 'taskflow_pomodoro_state',
  SETTINGS: 'taskflow_settings',
  USER_PREFERENCES: 'taskflow_user_preferences',
  SYNC_STATE: 'taskflow_sync_state',
} as const;
