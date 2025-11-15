'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Column, Task } from '../../types';
import BoardTaskCard from './BoardTaskCard';
import { PlusIcon, TrashIcon, GripVerticalIcon } from '../../constants';
import { useTaskManager } from '../../hooks/useTaskManager';
import { useConfirmation } from '../../hooks/useConfirmation';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from '../../hooks/useI18n';


interface BoardColumnProps {
    column: Column;
    tasks: Task[];
    onTaskDragStart: (taskId: string) => void;
    onTaskDragEnd: () => void;
    onDropOnColumn: (columnId: string) => void;
    onOpenTaskForm: (defaultValues: { listId: string; columnId: string; }) => void;
    onColumnDragStart: (columnId: string) => void;
}

const ColumnMenu: React.FC<{ column: Column, onRenameStart: () => void, onClose: () => void }> = ({ column, onRenameStart, onClose }) => {
    const { dispatch } = useTaskManager();
    const { confirm } = useConfirmation();
    const addToast = useToast();
    const { t } = useTranslation();
    const menuRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleDelete = async () => {
        onClose();
        const isConfirmed = await confirm({
            title: t('board.column.deleteConfirm.title', { columnName: column.name }),
            message: t('board.column.deleteConfirm.message'),
            confirmText: t('board.column.deleteConfirm.confirmText'),
        });
        if (isConfirmed) {
            dispatch({ type: 'DELETE_COLUMN', payload: { columnId: column.id, listId: column.listId } });
            addToast(t('board.column.deleteSuccess', { columnName: column.name }), 'success');
        }
    };

    return (
        <div ref={menuRef} className="absolute top-8 right-2 w-40 bg-popover rounded-md shadow-lg border border-border z-10">
            <div className="p-1">
                <button onClick={() => { onRenameStart(); onClose(); }} className="w-full text-left text-sm px-2 py-1.5 hover:bg-secondary rounded-sm">{t('board.column.menu.rename')}</button>
                <button onClick={handleDelete} className="w-full text-left text-sm px-2 py-1.5 hover:bg-destructive/10 text-destructive rounded-sm">{t('board.column.menu.delete')}</button>
            </div>
        </div>
    );
};

const BoardColumn: React.FC<BoardColumnProps> = ({ column, tasks, onTaskDragStart, onTaskDragEnd, onDropOnColumn, onOpenTaskForm, onColumnDragStart }) => {
    const { dispatch } = useTaskManager();
    const { t } = useTranslation();
    const [isDragOver, setIsDragOver] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [columnName, setColumnName] = useState(column.name);
    
    useEffect(() => {
        setColumnName(column.name)
    }, [column.name]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        onDropOnColumn(column.id);
        setIsDragOver(false);
    };
    
    const handleRenameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (columnName.trim() && columnName.trim() !== column.name) {
            dispatch({ type: 'UPDATE_COLUMN', payload: { columnId: column.id, name: columnName.trim() }});
        }
        setIsRenaming(false);
    }
    
    return (
        <div
            className={`
                w-72 flex-shrink-0 rounded-lg flex flex-col h-full max-h-full
                transition-colors duration-200
                ${isDragOver ? 'bg-primary/10' : 'bg-secondary'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div 
                className="p-3 flex items-center gap-1"
            >
                <div 
                    draggable 
                    onDragStart={() => onColumnDragStart(column.id)}
                    className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground p-1 -ml-1"
                    aria-label={t('board.column.dragHandle')}
                >
                    <GripVerticalIcon className="h-5 w-5" />
                </div>
                {isRenaming ? (
                    <form onSubmit={handleRenameSubmit} className="flex-grow">
                        <input
                            type="text"
                            value={columnName}
                            onChange={(e) => setColumnName(e.target.value)}
                            onBlur={handleRenameSubmit}
                            autoFocus
                            className="font-semibold text-sm p-1 -m-1 bg-card rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-full"
                        />
                    </form>
                ) : (
                    <h3 className="font-semibold text-sm cursor-pointer flex-grow" onClick={() => setIsRenaming(true)}>
                        {column.name} <span className="text-muted-foreground ml-1">{tasks.length}</span>
                    </h3>
                )}
                <div className="relative">
                     <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-1 rounded-md hover:bg-muted">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
                    </button>
                    {isMenuOpen && <ColumnMenu column={column} onRenameStart={() => setIsRenaming(true)} onClose={() => setIsMenuOpen(false)} />}
                </div>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {tasks.map(task => (
                    <BoardTaskCard
                        key={task.id}
                        task={task}
                        onDragStart={onTaskDragStart}
                        onDragEnd={onTaskDragEnd}
                    />
                ))}
            </div>
            <div className="p-2">
                 <button
                    onClick={() => onOpenTaskForm({ listId: column.listId, columnId: column.id })}
                    className="w-full flex items-center gap-2 p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                >
                    <PlusIcon className="h-4 w-4" />
                    <span className="text-sm">{t('board.column.addCard')}</span>
                </button>
            </div>
        </div>
    );
};

export default BoardColumn;
