'use client'

import React, { useMemo } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import { CloseIcon, CheckCircleIcon } from '../../constants';
import { Task } from '../../types';
import { useTranslation } from '../../hooks/useI18n';

interface FocusTaskPickerProps {
    onClose: () => void;
}

const FocusTaskPicker: React.FC<FocusTaskPickerProps> = ({ onClose }) => {
    const { state, dispatch } = useTaskManager();
    const { t } = useTranslation();

    const uncompletedTasks = useMemo(() => {
        return state.tasks.filter(task => !task.completed);
    }, [state.tasks]);
    
    const handleSelectTask = (taskId: string | null) => {
        dispatch({ type: 'SET_FOCUSED_TASK', payload: taskId });
        onClose();
    };

    return (
         <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[70vh]">
                <header className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t('focusPicker.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
                        <CloseIcon className="h-5 w-5 text-muted-foreground" />
                    </button>
                </header>
                <div className="flex-grow p-4 overflow-y-auto">
                    <ul className="space-y-2">
                        <li 
                            onClick={() => handleSelectTask(null)}
                            className="p-3 flex items-center justify-between rounded-md cursor-pointer hover:bg-secondary"
                        >
                            <span>{t('focusPicker.general')}</span>
                             {!state.pomodoro.focusedTaskId && <CheckCircleIcon className="h-5 w-5 text-primary" />}
                        </li>
                        {uncompletedTasks.map(task => (
                            <li 
                                key={task.id}
                                onClick={() => handleSelectTask(task.id)}
                                className="p-3 flex items-center justify-between rounded-md cursor-pointer hover:bg-secondary"
                            >
                                <span>{task.title}</span>
                                {state.pomodoro.focusedTaskId === task.id && <CheckCircleIcon className="h-5 w-5 text-primary" />}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default FocusTaskPicker;
