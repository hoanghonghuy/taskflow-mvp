import { AppDate, EntityId } from './common';
export interface CountdownEvent {
    id: EntityId;
    title: string;
    targetDate: AppDate;
    color: string;
    createdAt?: AppDate;
    notification?: boolean;
    reminderTimes?: AppDate[];
    category?: 'personal' | 'work' | 'holiday' | 'birthday' | 'custom';
    recurring?: CountdownRecurrence;
}
export interface CountdownRecurrence {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: AppDate;
}
export interface CountdownStats {
    totalEvents: number;
    upcomingEvents: number;
    passedEvents: number;
    eventsThisMonth: number;
}
export interface CountdownFilter {
    category?: string;
    dateRange?: {
        start: AppDate;
        end: AppDate;
    };
    showCompleted?: boolean;
}
