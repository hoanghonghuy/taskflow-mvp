'use client'

import React, { useState, useMemo } from 'react';
import { useTaskManager } from '../../hooks/useTaskManager';
import BoardColumn from './BoardColumn';
import { List, Column } from '../../types';
import { PlusIcon } from '../../constants';
import { useTranslation } from '../../hooks/useI18n';

interface BoardViewProps {
    onOpenTaskForm: (defaultValues?: { listId?: string; columnId?: string; }) => void;
}

const BoardView: React.FC<BoardViewProps> = ({ onOpenTaskForm }) => {
    const { state, dispatch } = useTaskManager();
    const { t } = useTranslation();
    const [selectedListId, setSelectedListId] = useState<string>(() => state.lists[0]?.id || '');
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
    const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
    const [newColumnName, setNewColumnName] = useState('');
    const [isAddingColumn, setIsAddingColumn] = useState(false);

    const availableLists = useMemo(() => state.lists.filter(l => l.id !== 'inbox'), [state.lists]);

    const handleListChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedListId(e.target.value);
    };

    const columnsForList = useMemo(() => {
        return state.columns.filter(c => c.listId === selectedListId);
    }, [state.columns, selectedListId]);

    const tasksForList = useMemo(() => {
        return state.tasks.filter(t => t.listId === selectedListId);
    }, [state.tasks, selectedListId]);

    const handleTaskDragStart = (taskId: string) => {
        setDraggedTaskId(taskId);
    };
    
    const handleTaskDragEnd = () => {
        setDraggedTaskId(null);
    };

    const handleDropOnColumn = (columnId: string) => {
        if (draggedTaskId) {
            dispatch({ type: 'MOVE_TASK_TO_COLUMN', payload: { taskId: draggedTaskId, newColumnId: columnId, listId: selectedListId } });
        }
        setDraggedTaskId(null);
    };
    
    const handleColumnDragStart = (columnId: string) => {
        setDraggedColumnId(columnId);
    }

    const handleColumnDrop = (droppedOnId: string) => {
        if (draggedColumnId && draggedColumnId !== droppedOnId) {
            dispatch({ type: 'REORDER_COLUMNS', payload: { listId: selectedListId, draggedId: draggedColumnId, droppedOnId } });
        }
        setDraggedColumnId(null);
        setDragOverColumnId(null);
    }
    
    const handleAddColumn = (e: React.FormEvent) => {
        e.preventDefault();
        if (newColumnName.trim() && selectedListId) {
            dispatch({ type: 'ADD_COLUMN', payload: { listId: selectedListId, name: newColumnName.trim() }});
            setNewColumnName('');
            setIsAddingColumn(false);
        }
    }
    
    if (availableLists.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <h2 className="text-xl font-semibold text-muted-foreground">{t('board.noLists')}</h2>
                <p className="text-sm text-muted-foreground">{t('board.noListsSubtitle')}</p>
            </div>
        );
    }
    
    // Effect to handle case where selected list is deleted
    React.useEffect(() => {
        if (!availableLists.find(l => l.id === selectedListId)) {
            if(availableLists.length > 0) {
                setSelectedListId(availableLists[0].id);
            } else {
                setSelectedListId('');
            }
        }
    }, [selectedListId, availableLists]);

    return (
        <div className="flex-1 flex flex-col min-w-0">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
                <h1 className="text-2xl font-bold">{t('board.title')}</h1>
                {availableLists.length > 0 && selectedListId && (
                    <select
                        value={selectedListId}
                        onChange={handleListChange}
                        className="p-2 bg-secondary/50 rounded-md text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        {availableLists.map(list => (
                            <option key={list.id} value={list.id}>{list.name}</option>
                        ))}
                    </select>
                )}
            </header>
            <main className="flex-1 flex gap-4 overflow-x-auto bg-background p-4 md:p-6 pb-20 md:pb-6" onDragEnd={() => { setDraggedColumnId(null); setDragOverColumnId(null); }}>
                {columnsForList.map(column => (
                    <div 
                        key={column.id} 
                        onDrop={() => {
                            handleColumnDrop(column.id);
                            setDragOverColumnId(null);
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            if (draggedColumnId && draggedColumnId !== column.id) {
                                setDragOverColumnId(column.id);
                            }
                        }}
                        onDragLeave={() => {
                            setDragOverColumnId(null);
                        }}
                        className={`
                            transition-all duration-200 p-1 rounded-lg
                            ${draggedColumnId === column.id ? 'opacity-30' : ''}
                            ${draggedColumnId && dragOverColumnId === column.id ? 'bg-primary/10' : ''}
                        `}
                    >
                        <BoardColumn
                            column={column}
                            tasks={tasksForList.filter(t => t.columnId === column.id || (!t.columnId && columnsForList.findIndex(c => c.id === column.id) === 0))}
                            onTaskDragStart={handleTaskDragStart}
                            onTaskDragEnd={handleTaskDragEnd}
                            onDropOnColumn={handleDropOnColumn}
                            onOpenTaskForm={onOpenTaskForm}
                            onColumnDragStart={handleColumnDragStart}
                        />
                    </div>
                ))}
                 <div className="w-72 flex-shrink-0">
                    {isAddingColumn ? (
                        <form onSubmit={handleAddColumn} className="bg-secondary p-2 rounded-lg">
                            <input
                                autoFocus
                                type="text"
                                value={newColumnName}
                                onChange={e => setNewColumnName(e.target.value)}
                                placeholder={t('board.column.namePlaceholder')}
                                className="w-full p-2 bg-card rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <div className="flex items-center gap-2 mt-2">
                                <button type="submit" className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-semibold">{t('board.column.addColumn')}</button>
                                <button type="button" onClick={() => setIsAddingColumn(false)} className="text-sm text-muted-foreground">{t('board.column.cancel')}</button>
                            </div>
                        </form>
                    ) : (
                        <button 
                            onClick={() => setIsAddingColumn(true)}
                            className="w-full flex items-center gap-2 p-3 rounded-lg text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                        >
                            <PlusIcon className="h-5 w-5" />
                            <span className="text-sm font-semibold">{t('board.addColumn')}</span>
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};

export default BoardView;
