'use client'

import React from 'react';
import { Task } from '../../types';
import { useTaskManager } from '../../hooks/useTaskManager';
import { useUser } from '../../hooks/useUser';
import Avatar from '../ui/Avatar';
import { PRIORITY_MAP, RepeatIcon, CheckCircleIcon, ChatBubbleOvalLeftEllipsisIcon } from '../../constants';

interface BoardTaskCardProps {
    task: Task;
    onDragStart: (taskId: string) => void;
    onDragEnd: () => void;
}

const BoardTaskCard: React.FC<BoardTaskCardProps> = ({ task, onDragStart, onDragEnd }) => {
    const { dispatch } = useTaskManager();
    const { allUsers } = useUser();

    const assignee = allUsers.find(u => u.id === task.assigneeId);
    const completedSubtasks = task.subtasks.filter(st => st.completed).length;

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(task.id);
    };

    const handleSelect = () => {
        const originalId = task.id.split('_')[0];
        dispatch({ type: 'SET_SELECTED_TASK', payload: originalId });
    };

    const isPast = (date: Date): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Compare with start of today
        return date.getTime() < today.getTime();
    };
    
    const dueDateLabel = () => {
        if (!task.dueDate) return null;
        const date = new Date(task.dueDate);
        const isDuePast = isPast(date) && !task.completed;
        const color = isDuePast ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground';
        
        return <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
            {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>;
    };


    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
            onClick={handleSelect}
            className="bg-card p-3 rounded-lg border border-border shadow-sm cursor-pointer hover:bg-muted hover:shadow-md"
        >
            <p className="text-sm font-medium mb-2">{task.title}</p>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {task.subtasks.length > 0 && (
                        <span className={`flex items-center gap-1 ${completedSubtasks === task.subtasks.length && task.subtasks.length > 0 ? 'text-green-500' : ''}`}>
                            <CheckCircleIcon className="h-4 w-4" />
                            {completedSubtasks}/{task.subtasks.length}
                        </span>
                    )}
                    {task.comments && task.comments.length > 0 && (
                        <span className="flex items-center gap-1">
                            <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4" />
                            {task.comments.length}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {dueDateLabel()}
                    {assignee && <Avatar user={assignee} className="w-6 h-6" />}
                </div>
            </div>
        </div>
    );
};

export default BoardTaskCard;
