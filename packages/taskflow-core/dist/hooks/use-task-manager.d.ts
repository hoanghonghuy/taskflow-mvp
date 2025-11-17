import { Action } from '../tasks/reducer';
import { AppState } from '../types';
interface UseTaskManagerOptions {
    storageAdapter?: any;
    autoSave?: boolean;
}
export declare function useTaskManager(options?: UseTaskManagerOptions): {
    state: AppState;
    dispatch: import("react").Dispatch<Action>;
    addTask: (task: Omit<AppState["tasks"][0], "id">) => void;
    updateTask: (task: AppState["tasks"][0]) => void;
    deleteTask: (taskId: string) => void;
    toggleTaskCompletion: (taskId: string) => void;
    setView: (view: AppState["view"]) => void;
    setSelectedTask: (taskId: string | null) => void;
    setActiveList: (listId: string) => void;
    addHabit: (habit: Omit<AppState["habits"][0], "id" | "completions" | "createdAt">) => void;
    toggleHabitCompletion: (habitId: string, date: string) => void;
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    tickTimer: () => void;
    setOnlineStatus: (isOnline: boolean) => void;
    setSyncState: (syncStatus: AppState["syncStatus"]) => void;
    loadState: () => Promise<void>;
    saveState: () => Promise<void>;
};
export {};
