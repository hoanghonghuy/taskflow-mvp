import { Priority, AppDate, EntityId } from './common';
export interface Task {
    id: EntityId;
    title: string;
    description: string;
    completed: boolean;
    completedAt?: AppDate;
    dueDate?: AppDate;
    priority: Priority;
    listId: EntityId;
    columnId?: EntityId;
    tags: string[];
    subtasks: Subtask[];
    recurrence?: RecurrencePattern;
    reminderMinutes?: number;
    assigneeId?: EntityId | null;
    comments: Comment[];
    createdAt?: AppDate;
    totalFocusTime?: number;
}
export interface Subtask {
    id: EntityId;
    title: string;
    completed: boolean;
}
export interface RecurrencePattern {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: AppDate;
}
export interface Comment {
    id: EntityId;
    userId: EntityId;
    content: string;
    timestamp: AppDate;
}
export interface List {
    id: EntityId;
    name: string;
    color: string;
    members: EntityId[];
}
export interface Column {
    id: EntityId;
    name: string;
    listId: EntityId;
}
export interface TaskFilter {
    completed?: boolean;
    priority?: Priority;
    listId?: EntityId;
    tags?: string[];
    dueDateRange?: {
        start: AppDate;
        end: AppDate;
    };
}
