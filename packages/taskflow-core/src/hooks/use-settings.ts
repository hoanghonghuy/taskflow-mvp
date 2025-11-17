import { useState, useEffect, useCallback } from 'react';
import { Settings } from '../types';
import { StorageService, STORAGE_KEYS } from '../utils/storage';

interface UseSettingsOptions {
  storageAdapter?: any;
  autoSave?: boolean;
}

const defaultSettings: Settings = {
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

export function useSettings(options: UseSettingsOptions = {}) {
  const { storageAdapter, autoSave = true } = options;
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  
  // Initialize storage service if adapter provided
  const storageService = storageAdapter ? new StorageService(storageAdapter) : null;

  // Load settings from storage on mount
  useEffect(() => {
    if (storageService && autoSave) {
      loadSettings();
    }
  }, [storageService, autoSave]);

  // Auto-save settings to storage when they change
  useEffect(() => {
    if (storageService && autoSave) {
      saveSettings();
    }
  }, [settings, storageService, autoSave]);

  const loadSettings = useCallback(async () => {
    if (!storageService) return;
    
    try {
      const savedSettings = await storageService.get<Settings>(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...savedSettings });
      }
    } catch (error) {
      console.warn('Failed to load settings from storage:', error);
    }
  }, [storageService]);

  const saveSettings = useCallback(async () => {
    if (!storageService) return;
    
    try {
      await storageService.set(STORAGE_KEYS.SETTINGS, settings);
    } catch (error) {
      console.warn('Failed to save settings to storage:', error);
    }
  }, [storageService, settings]);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateMultipleSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  // Specific setting updaters
  const setLanguage = useCallback((language: Settings['language']) => {
    updateSetting('language', language);
  }, [updateSetting]);

  const setTheme = useCallback((theme: Settings['theme']) => {
    updateSetting('theme', theme);
  }, [updateSetting]);

  const setBottomNavActions = useCallback((actions: Settings['bottomNavActions']) => {
    updateSetting('bottomNavActions', actions);
  }, [updateSetting]);

  const toggleNotifications = useCallback(() => {
    setSettings((prev: Settings) => ({ ...prev, notifications: !prev.notifications }));
  }, []);

  const toggleSoundEnabled = useCallback(() => {
    setSettings((prev: Settings) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const toggleBiometricAuth = useCallback(() => {
    setSettings((prev: Settings) => ({ ...prev, biometricAuth: !prev.biometricAuth }));
  }, []);

  const toggleHapticFeedback = useCallback(() => {
    setSettings((prev: Settings) => ({ ...prev, hapticFeedback: !prev.hapticFeedback }));
  }, []);

  const toggleDataSync = useCallback(() => {
    setSettings((prev: Settings) => ({ ...prev, dataSyncEnabled: !prev.dataSyncEnabled }));
  }, []);

  const toggleBackupToCloud = useCallback(() => {
    setSettings((prev: Settings) => ({ ...prev, backupToCloud: !prev.backupToCloud }));
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
