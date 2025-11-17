"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSettings = useSettings;
const react_1 = require("react");
const storage_1 = require("../utils/storage");
const defaultSettings = {
    language: 'en',
    theme: 'system',
    notifications: true,
    soundEnabled: true,
    autoStartPomodoro: false,
    defaultPriority: 'medium',
    defaultListId: 'inbox',
    bottomNavActions: ['dashboard', 'list', 'habit', 'pomodoro'],
    // Mobile-specific defaults
    biometricAuth: false,
    hapticFeedback: true,
    darkModeAuto: true,
    dataSyncEnabled: true,
    backupToCloud: false,
};
function useSettings(options = {}) {
    const { storageAdapter, autoSave = true } = options;
    const [settings, setSettings] = (0, react_1.useState)(defaultSettings);
    // Initialize storage service if adapter provided
    const storageService = storageAdapter ? new storage_1.StorageService(storageAdapter) : null;
    // Load settings from storage on mount
    (0, react_1.useEffect)(() => {
        if (storageService && autoSave) {
            loadSettings();
        }
    }, [storageService, autoSave]);
    // Auto-save settings to storage when they change
    (0, react_1.useEffect)(() => {
        if (storageService && autoSave) {
            saveSettings();
        }
    }, [settings, storageService, autoSave]);
    const loadSettings = (0, react_1.useCallback)(async () => {
        if (!storageService)
            return;
        try {
            const savedSettings = await storageService.get(storage_1.STORAGE_KEYS.SETTINGS);
            if (savedSettings) {
                setSettings({ ...defaultSettings, ...savedSettings });
            }
        }
        catch (error) {
            console.warn('Failed to load settings from storage:', error);
        }
    }, [storageService]);
    const saveSettings = (0, react_1.useCallback)(async () => {
        if (!storageService)
            return;
        try {
            await storageService.set(storage_1.STORAGE_KEYS.SETTINGS, settings);
        }
        catch (error) {
            console.warn('Failed to save settings to storage:', error);
        }
    }, [storageService, settings]);
    const updateSetting = (0, react_1.useCallback)((key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);
    const updateMultipleSettings = (0, react_1.useCallback)((updates) => {
        setSettings(prev => ({ ...prev, ...updates }));
    }, []);
    const resetSettings = (0, react_1.useCallback)(() => {
        setSettings(defaultSettings);
    }, []);
    // Specific setting updaters
    const setLanguage = (0, react_1.useCallback)((language) => {
        updateSetting('language', language);
    }, [updateSetting]);
    const setTheme = (0, react_1.useCallback)((theme) => {
        updateSetting('theme', theme);
    }, [updateSetting]);
    const setBottomNavActions = (0, react_1.useCallback)((actions) => {
        updateSetting('bottomNavActions', actions);
    }, [updateSetting]);
    const toggleNotifications = (0, react_1.useCallback)(() => {
        setSettings((prev) => ({ ...prev, notifications: !prev.notifications }));
    }, []);
    const toggleSoundEnabled = (0, react_1.useCallback)(() => {
        setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
    }, []);
    const toggleBiometricAuth = (0, react_1.useCallback)(() => {
        setSettings((prev) => ({ ...prev, biometricAuth: !prev.biometricAuth }));
    }, []);
    const toggleHapticFeedback = (0, react_1.useCallback)(() => {
        setSettings((prev) => ({ ...prev, hapticFeedback: !prev.hapticFeedback }));
    }, []);
    const toggleDataSync = (0, react_1.useCallback)(() => {
        setSettings((prev) => ({ ...prev, dataSyncEnabled: !prev.dataSyncEnabled }));
    }, []);
    const toggleBackupToCloud = (0, react_1.useCallback)(() => {
        setSettings((prev) => ({ ...prev, backupToCloud: !prev.backupToCloud }));
    }, []);
    return {
        settings,
        setSettings,
        // Generic methods
        updateSetting,
        updateMultipleSettings,
        resetSettings,
        // Specific setters
        setLanguage,
        setTheme,
        setBottomNavActions,
        // Toggles
        toggleNotifications,
        toggleSoundEnabled,
        toggleBiometricAuth,
        toggleHapticFeedback,
        toggleDataSync,
        toggleBackupToCloud,
        // Storage methods
        loadSettings,
        saveSettings,
    };
}
