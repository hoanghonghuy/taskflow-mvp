import { Settings } from '../types';
interface UseSettingsOptions {
    storageAdapter?: any;
    autoSave?: boolean;
}
export declare function useSettings(options?: UseSettingsOptions): {
    settings: Settings;
    setSettings: import("react").Dispatch<import("react").SetStateAction<Settings>>;
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    updateMultipleSettings: (updates: Partial<Settings>) => void;
    resetSettings: () => void;
    setLanguage: (language: Settings["language"]) => void;
    setTheme: (theme: Settings["theme"]) => void;
    setBottomNavActions: (actions: Settings["bottomNavActions"]) => void;
    toggleNotifications: () => void;
    toggleSoundEnabled: () => void;
    toggleBiometricAuth: () => void;
    toggleHapticFeedback: () => void;
    toggleDataSync: () => void;
    toggleBackupToCloud: () => void;
    loadSettings: () => Promise<void>;
    saveSettings: () => Promise<void>;
};
export {};
