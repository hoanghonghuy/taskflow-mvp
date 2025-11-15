'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import TaskItem from '@/components/task/TaskItem'
import { PlusIcon, GripVerticalIcon } from '@/lib/constants'
import type { Column, Task } from '@/types'

interface BoardColumnProps {
  column: Column
  tasks: Task[]
  onTaskDragStart: (taskId: string) => void
  onTaskDragEnd: () => void
  onDropOnColumn: (columnId: string) => void
  onOpenTaskForm?: (defaultValues?: { listId?: string; columnId?: string }) => void
  onColumnDragStart: (columnId: string) => void
}

const BoardColumn: React.FC<BoardColumnProps> = ({
  column,
  tasks,
  onTaskDragStart,
  onTaskDragEnd,
  onDropOnColumn,
  onOpenTaskForm,
  onColumnDragStart,
}) => {
  const { dispatch } = useTaskManager()
  const { t } = useI18n()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [columnName, setColumnName] = useState(column.name)

  useEffect(() => {
    setColumnName(column.name)
  }, [column.name])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    onDropOnColumn(column.id)
    setIsDragOver(false)
  }

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (columnName.trim() && columnName.trim() !== column.name) {
      dispatch({
        type: 'UPDATE_COLUMN',
        payload: { columnId: column.id, name: columnName.trim() },
      })
    }
    setIsRenaming(false)
  }

  return (
    <div
      className={`
        w-72 flex-shrink-0 rounded-lg flex flex-col h-full max-h-full
        border border-border
        transition-colors duration-200
        ${isDragOver ? 'bg-primary/10 border-primary' : 'bg-secondary'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-3 flex items-center gap-1 flex-shrink-0">
        <div
          draggable
          onDragStart={() => onColumnDragStart(column.id)}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground p-1 -ml-1"
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
              className="font-semibold text-sm p-1 -m-1 bg-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-full"
            />
          </form>
        ) : (
          <h3
            className="font-semibold text-sm cursor-pointer flex-grow"
            onClick={() => setIsRenaming(true)}
          >
            {column.name} <span className="text-muted-foreground ml-1">{tasks.length}</span>
          </h3>
        )}
        <button
          onClick={() => {
            dispatch({
              type: 'DELETE_COLUMN',
              payload: { columnId: column.id, listId: column.listId },
            })
          }}
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
          aria-label={t('board.column.delete')}
        >
          ×
        </button>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-0">
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            isDraggable={true}
            onDragStart={onTaskDragStart}
            onDrop={() => {}}
          />
        ))}
      </div>
      {onOpenTaskForm && (
        <div className="p-2 flex-shrink-0">
          <button
            onClick={() => onOpenTaskForm({ listId: column.listId, columnId: column.id })}
            className="w-full flex items-center gap-2 p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="text-sm">{t('board.addTask')}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default BoardColumn

