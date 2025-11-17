import { AppDate, EntityId } from './common';
export type MobileNavigationState = {
    index: number;
    routes: Array<{
        key: string;
        name: string;
        params?: Record<string, any>;
    }>;
    history?: Array<{
        type: 'route' | 'action';
        route?: string;
        action?: any;
    }>;
};
export interface MobilePermissions {
    notifications: boolean;
    camera: boolean;
    microphone: boolean;
    storage: boolean;
    location?: boolean;
}
export interface DeviceInfo {
    platform: 'ios' | 'android';
    version: string;
    model: string;
    isTablet: boolean;
    statusBarHeight: number;
    bottomNavHeight: number;
}
export interface SyncState {
    isOnline: boolean;
    lastSyncTime?: AppDate;
    pendingChanges: number;
    syncInProgress: boolean;
    syncError?: string;
}
export interface MobileNotification {
    id: EntityId;
    title: string;
    body: string;
    data?: Record<string, any>;
    scheduledTime?: AppDate;
    type: 'reminder' | 'pomodoro' | 'habit' | 'achievement';
}
export interface BiometricAuth {
    available: boolean;
    supportedTypes: ('fingerprint' | 'face' | 'iris')[];
    enrolled: boolean;
}
export interface StorageStats {
    totalSpace: number;
    freeSpace: number;
    usedSpace: number;
    cacheSize: number;
}
