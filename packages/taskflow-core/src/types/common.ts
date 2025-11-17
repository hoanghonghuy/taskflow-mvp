export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export type SortOrder = 'default' | 'dueDateAsc' | 'dueDateDesc';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export type View = 
  | 'dashboard' 
  | 'list' 
  | 'board' 
  | 'calendar' 
  | 'pomodoro' 
  | 'matrix' 
  | 'habit' 
  | 'countdown' 
  | 'settings' 
  | 'achievements' 
  | 'profile';

export type ThemePresetId =
  | 'light'
  | 'dark'
  | 'classic-fog'
  | 'warm-ivory'
  | 'cool-slate'
  | 'minimal-charcoal'
  | 'soft-pastel'
  | 'night-indigo'
  | 'graphite-ember'
  | 'forest-noir'
  | 'plum-eclipse'
  | 'carbon-minimal';

export type ThemeOption = ThemePresetId | 'system';

// Mobile-specific date handling - use Date objects for better performance
export type AppDate = Date | string;

// Mobile-specific color handling - hex codes for React Native
export type AppColor = string;

// Mobile-specific ID handling
export type EntityId = string;
