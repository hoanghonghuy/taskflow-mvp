"use client"

import React, { useState } from 'react'
import { useColumnActions } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { useConfirmation } from '@/lib/hooks/use-confirmation'
import type { TranslationKey } from '@/lib/i18n/types'
import TaskItem from '@/features/tasks/components/TaskItem'
import { PlusIcon, GripVerticalIcon, TrashIcon } from '@/lib/icons'
import {
  CountBadge,
  TaskColumnBody,
  TaskColumnFooter,
  TaskColumnHeader,
  TaskColumnShell,
} from '@/components/layout/task-column-shell'
import { TaskMoveControl } from '@/components/ui/task-move-control'
import type { Column, Task } from '@/types'

interface BoardColumnProps {
  column: Column
  tasks: Task[]
  onTaskDragStart: (taskId: string) => void
  onDropOnColumn: (columnId: string) => void
  onOpenTaskForm?: (defaultValues?: { listId?: string; columnId?: string }) => void
  onColumnDragStart: (columnId: string) => void
  columns: Column[]
  onMoveTask: (taskId: string, columnId: string) => void
  canManageColumns?: boolean
}

const BoardColumn: React.FC<BoardColumnProps> = ({
  column,
  tasks,
  onTaskDragStart,
  onDropOnColumn,
  onOpenTaskForm,
  onColumnDragStart,
  columns,
  onMoveTask,
  canManageColumns = true,
}) => {
  const { updateColumn, deleteColumn } = useColumnActions()
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
      void updateColumn(column.id, columnName.trim())
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

    void deleteColumn(column.id, column.listId)
  }

  return (
    <TaskColumnShell
      variant="board"
      isDragOver={isDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <TaskColumnHeader>
        {canManageColumns ? (
          <div
            draggable
            onDragStart={() => onColumnDragStart(column.id)}
            className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground p-1 -ml-1"
            aria-label={t('board.column.dragHandle')}
          >
            <GripVerticalIcon className="h-5 w-5" />
          </div>
        ) : (
          <div className="p-1 -ml-1 text-muted-foreground/30" aria-hidden>
            <GripVerticalIcon className="h-5 w-5" />
          </div>
        )}
        {canManageColumns && isRenaming ? (
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
        ) : canManageColumns ? (
          <button
            type="button"
            className="flex items-center justify-between gap-2 grow text-left cursor-pointer"
            onClick={() => setIsRenaming(true)}
          >
            <span className="font-semibold text-sm truncate">{column.name}</span>
            <CountBadge count={tasks.length} />
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2 grow text-left">
            <span className="font-semibold text-sm truncate">{column.name}</span>
            <CountBadge count={tasks.length} />
          </div>
        )}
        {canManageColumns && (
          <button
            type="button"
            onClick={handleDeleteColumn}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted/60 transition-colors"
            aria-label={t('board.column.delete')}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </TaskColumnHeader>
      <TaskColumnBody>
        {tasks.map(task => (
          <div key={task.id} className="group">
            <TaskItem
              task={task}
              isDraggable={canManageColumns}
              onDragStart={onTaskDragStart}
            />
            {canManageColumns && columns.length > 1 ? (
              <TaskMoveControl
                label={t('board.moveTask' as TranslationKey)}
                value={column.id}
                options={columns.map((target) => ({
                  value: target.id,
                  label: target.name,
                }))}
                onMove={(columnId) => onMoveTask(task.id, columnId)}
              />
            ) : null}
          </div>
        ))}
      </TaskColumnBody>
      {onOpenTaskForm && canManageColumns && (
        <TaskColumnFooter>
          <button
            onClick={() => onOpenTaskForm({ listId: column.listId, columnId: column.id })}
            className="w-full flex items-center gap-2 p-2 rounded-md text-muted-foreground hover:bg-muted/60 hover:text-primary transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="text-sm">{t('board.addTask')}</span>
          </button>
        </TaskColumnFooter>
      )}
    </TaskColumnShell>
  )
}

export default BoardColumn
