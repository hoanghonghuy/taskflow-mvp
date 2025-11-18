"use client"

import React, { useState } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useConfirmation } from '@/lib/hooks/use-confirmation'
import type { TranslationKey } from '@/lib/i18n/types'
import TaskItem from '@/features/tasks/components/TaskItem'
import { PlusIcon, GripVerticalIcon } from '@/lib/icons'
import type { Column, Task } from '@/types'

interface BoardColumnProps {
  column: Column
  tasks: Task[]
  onTaskDragStart: (taskId: string) => void
  onDropOnColumn: (columnId: string) => void
  onOpenTaskForm?: (defaultValues?: { listId?: string; columnId?: string }) => void
  onColumnDragStart: (columnId: string) => void
}

const BoardColumn: React.FC<BoardColumnProps> = ({
  column,
  tasks,
  onTaskDragStart,
  onDropOnColumn,
  onOpenTaskForm,
  onColumnDragStart,
}) => {
  const { dispatch } = useTaskManager()
  const { t } = useI18n()
  const { confirm } = useConfirmation()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [columnName, setColumnName] = useState(column.name)

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

  const handleDeleteColumn = async () => {
    const isConfirmed = await confirm({
      title: t('board.column.deleteConfirm.title' as TranslationKey, { name: column.name }),
      description: t('board.column.deleteConfirm.description' as TranslationKey, { name: column.name }),
      confirmText: t('board.column.deleteConfirm.confirm' as TranslationKey),
      cancelText: t('common.cancel' as TranslationKey),
      variant: 'destructive',
    })

    if (!isConfirmed) return

    dispatch({
      type: 'DELETE_COLUMN',
      payload: { columnId: column.id, listId: column.listId },
    })
  }

  return (
    <div
      className={`
        w-full md:w-72 md:shrink-0 rounded-xl flex flex-col min-h-[260px] md:min-h-[calc(100vh-220px)]
        border border-border shadow-sm
        transition-colors duration-200
        ${isDragOver ? 'bg-primary/10 border-primary' : 'bg-card'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-3 flex items-center gap-2 shrink-0 border-b border-border/60">
        <div
          draggable
          onDragStart={() => onColumnDragStart(column.id)}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground p-1 -ml-1"
          aria-label={t('board.column.dragHandle')}
        >
          <GripVerticalIcon className="h-5 w-5" />
        </div>
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="grow">
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
          <button
            type="button"
            className="flex items-center justify-between gap-2 grow text-left cursor-pointer"
            onClick={() => setIsRenaming(true)}
          >
            <span className="font-semibold text-sm truncate">{column.name}</span>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
              {tasks.length}
            </span>
          </button>
        )}
        <button
          onClick={handleDeleteColumn}
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
          aria-label={t('board.column.delete')}
        >
          ×
        </button>
      </div>
      <div className="p-2 space-y-2">
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
        <div className="p-2 shrink-0">
          <button
            onClick={() => onOpenTaskForm({ listId: column.listId, columnId: column.id })}
            className="w-full flex items-center gap-2 p-2 rounded-md text-muted-foreground hover:bg-muted/60 hover:text-primary transition-colors"
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

