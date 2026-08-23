"use client"

import React, { useState } from 'react'
import { useColumnActions } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { useConfirmation } from '@/lib/hooks/use-confirmation'
import type { TranslationKey } from '@/lib/i18n/types'
import TaskItem from '@/features/tasks/components/TaskItem'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  GripVerticalIcon,
  TrashIcon,
} from '@/lib/icons'
import {
  CountBadge,
  TaskColumnBody,
  TaskColumnFooter,
  TaskColumnHeader,
  TaskColumnShell,
} from '@/components/layout/task-column-shell'
import { TaskMoveControl } from '@/components/ui/task-move-control'
import { IconButton } from '@/components/ui/icon-button'
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
  onMoveColumn: (offset: -1 | 1) => void
  canMoveUp: boolean
  canMoveDown: boolean
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
  onMoveColumn,
  canMoveUp,
  canMoveDown,
  canManageColumns = true,
}) => {
  const { updateColumn, deleteColumn } = useColumnActions()
  const { t } = useI18n()
  const { confirm } = useConfirmation()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [columnName, setColumnName] = useState(column.name)
  const canDeleteColumn = canManageColumns && columns.length > 1

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    onDropOnColumn(column.id)
    setIsDragOver(false)
  }

  const handleRenameSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const nextName = columnName.trim()
    if (nextName && nextName !== column.name) {
      void updateColumn(column.id, nextName)
    } else if (!nextName) {
      setColumnName(column.name)
    }
    setIsRenaming(false)
  }

  const handleDeleteColumn = async () => {
    if (!canDeleteColumn) return

    const isConfirmed = await confirm({
      title: t('board.column.deleteConfirm.title' as TranslationKey, { name: column.name }),
      description: t('board.column.deleteConfirm.description' as TranslationKey, { name: column.name }),
      confirmText: t('board.column.deleteConfirm.confirm' as TranslationKey),
      cancelText: t('common.cancel' as TranslationKey),
      variant: 'destructive',
    })

    if (isConfirmed) void deleteColumn(column.id, column.listId)
  }

  return (
    <TaskColumnShell
      variant="board"
      isDragOver={isDragOver}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={isDragOver ? 'ring-2 ring-primary/20 ring-offset-2 ring-offset-background' : undefined}
    >
      <TaskColumnHeader className="min-h-14">
        {canManageColumns ? (
          <div
            draggable
            onDragStart={() => onColumnDragStart(column.id)}
            className="-ml-1 cursor-grab rounded-md p-1 text-muted-foreground/45 transition-colors hover:bg-muted/60 hover:text-muted-foreground active:cursor-grabbing"
            aria-label={t('board.column.dragHandle')}
          >
            <GripVerticalIcon className="h-5 w-5" />
          </div>
        ) : (
          <div className="-ml-1 p-1 text-muted-foreground/25" aria-hidden>
            <GripVerticalIcon className="h-5 w-5" />
          </div>
        )}

        {canManageColumns && isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="min-w-0 grow">
            <input
              type="text"
              value={columnName}
              onChange={(event) => setColumnName(event.target.value)}
              onBlur={handleRenameSubmit}
              autoFocus
              className="w-full rounded-md border border-primary/40 bg-background px-2 py-1 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
        ) : canManageColumns ? (
          <button
            type="button"
            className="flex min-w-0 grow items-center justify-between gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-muted/50"
            onClick={() => setIsRenaming(true)}
          >
            <span className="truncate text-sm font-semibold">{column.name}</span>
            <CountBadge count={tasks.length} />
          </button>
        ) : (
          <div className="flex min-w-0 grow items-center justify-between gap-2 px-1">
            <span className="truncate text-sm font-semibold">{column.name}</span>
            <CountBadge count={tasks.length} />
          </div>
        )}

        {canManageColumns && (
          <div className="flex items-center">
            <IconButton
              type="button"
              disabled={!canMoveUp}
              onClick={() => onMoveColumn(-1)}
              size="sm"
              variant="toolbar"
              aria-label={t('common.moveUp')}
            >
              <ArrowUpIcon className="h-4 w-4" />
            </IconButton>
            <IconButton
              type="button"
              disabled={!canMoveDown}
              onClick={() => onMoveColumn(1)}
              size="sm"
              variant="toolbar"
              aria-label={t('common.moveDown')}
            >
              <ArrowDownIcon className="h-4 w-4" />
            </IconButton>
            <IconButton
              type="button"
              disabled={!canDeleteColumn}
              onClick={handleDeleteColumn}
              size="sm"
              variant="destructive"
              aria-label={t('board.column.delete')}
            >
              <TrashIcon className="h-4 w-4" />
            </IconButton>
          </div>
        )}
      </TaskColumnHeader>

      <TaskColumnBody className={tasks.length === 0 ? 'flex items-center justify-center p-3' : 'p-2'}>
        {tasks.length === 0 ? (
          <button
            type="button"
            onClick={() =>
              canManageColumns && onOpenTaskForm?.({ listId: column.listId, columnId: column.id })
            }
            disabled={!canManageColumns || !onOpenTaskForm}
            className={`flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-center transition-[border-color,background-color,color] motion-reduce:transition-none ${
              isDragOver
                ? 'border-primary bg-primary/10 text-primary'
                : canManageColumns && onOpenTaskForm
                  ? 'border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary'
                  : 'border-border/50 text-muted-foreground/60'
            }`}
          >
            {canManageColumns && onOpenTaskForm ? <PlusIcon className="h-5 w-5" /> : null}
            <span className="text-sm font-medium">{t('board.addTask')}</span>
          </button>
        ) : (
          tasks.map((task) => (
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
                  options={columns.map((target) => ({ value: target.id, label: target.name }))}
                  onMove={(columnId) => onMoveTask(task.id, columnId)}
                />
              ) : null}
            </div>
          ))
        )}
      </TaskColumnBody>

      {onOpenTaskForm && canManageColumns && tasks.length > 0 && (
        <TaskColumnFooter>
          <button
            type="button"
            onClick={() => onOpenTaskForm({ listId: column.listId, columnId: column.id })}
            className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{t('board.addTask')}</span>
          </button>
        </TaskColumnFooter>
      )}
    </TaskColumnShell>
  )
}

export default BoardColumn
