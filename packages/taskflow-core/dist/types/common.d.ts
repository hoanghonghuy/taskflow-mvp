export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';
export type SortOrder = 'default' | 'dueDateAsc' | 'dueDateDesc';
export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}
export type View = 'dashboard' | 'list' | 'board' | 'calendar' | 'pomodoro' | 'matrix' | 'habit' | 'countdown' | 'settings' | 'achievements' | 'profile';
export type ThemePresetId = 'light' | 'dark' | 'classic-fog' | 'warm-ivory' | 'cool-slate' | 'minimal-charcoal' | 'soft-pastel' | 'night-indigo' | 'graphite-ember' | 'forest-noir' | 'plum-eclipse' | 'carbon-minimal';
export type ThemeOption = ThemePresetId | 'system';
export type AppDate = Date | string;
export type AppColor = string;
export type EntityId = string;
