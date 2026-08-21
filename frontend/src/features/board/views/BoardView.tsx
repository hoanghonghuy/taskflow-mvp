'use client'

import React, { useMemo, useState } from 'react'
import {
  useTaskManager,
  useTaskActions,
  useColumnActions,
} from '@/components/providers/task-manager-provider'
import { useUser } from '@/components/providers/user-provider'
import { useI18n } from '@/lib/i18n/hooks'
import BoardColumn from '@/features/board/components/BoardColumn'
import { PlusIcon } from '@/lib/icons'
import { AppPage, AppPageMain } from '@/components/layout/app-page'
import { AppPageHeader } from '@/components/layout/app-page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buildBoardColumns } from '@/lib/utils/task-helpers'
import { isSharedListMember } from '@/lib/utils/list-access'
import type { Column } from '@/types'

interface BoardViewProps {
  onOpenTaskForm?: (defaultValues?: { listId?: string; columnId?: string }) => void
}

const BoardView: React.FC<BoardViewProps> = ({ onOpenTaskForm }) => {
  const { state } = useTaskManager()
  const { user } = useUser()
  const { t } = useI18n()
  const { moveTaskToColumn } = useTaskActions()
  const { addColumn, reorderColumns } = useColumnActions()

  const availableLists = useMemo(
    () => state.lists.filter((list) => list.id !== 'inbox' && list.name !== 'Inbox'),
    [state.lists],
  )

  const initialListId = availableLists[0]?.id ?? ''
  const [selectedListId, setSelectedListId] = useState<string>(() => initialListId)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)
  const [newColumnName, setNewColumnName] = useState('')
  const [isAddingColumn, setIsAddingColumn] = useState(false)

  const effectiveSelectedListId = availableLists.some((list) => list.id === selectedListId)
    ? selectedListId
    : availableLists[0]?.id ?? ''

  const selectedList = useMemo(
    () => state.lists.find((list) => list.id === effectiveSelectedListId) ?? null,
    [effectiveSelectedListId, state.lists],
  )

  const columnsForList = useMemo(() => {
    const listTasks = state.tasks.filter((task) => task.listId === effectiveSelectedListId)
    const isSharedMemberView = isSharedListMember(selectedList, user?.id)

    if (!isSharedMemberView) {
      return state.columns.filter((column) => column.listId === effectiveSelectedListId)
    }

    const fallbackColumns = selectedList
      ? buildBoardColumns([selectedList], listTasks).filter(
          (column) => column.listId === effectiveSelectedListId,
        )
      : []
    const merged = new Map<string, Column>()
    for (const column of fallbackColumns) merged.set(column.id, column)
    for (const column of state.columns) {
      if (column.listId === effectiveSelectedListId) merged.set(column.id, column)
    }
    return [...merged.values()]
  }, [effectiveSelectedListId, selectedList, state.columns, state.tasks, user?.id])

  const canManageColumns = !isSharedListMember(selectedList, user?.id)

  const tasksForList = useMemo(
    () => state.tasks.filter((task) => task.listId === effectiveSelectedListId),
    [effectiveSelectedListId, state.tasks],
  )

  const handleDropOnColumn = (columnId: string) => {
    if (!canManageColumns) {
      setDraggedTaskId(null)
      setDragOverColumnId(null)
      return
    }
    if (draggedTaskId) {
      void moveTaskToColumn(draggedTaskId, columnId, effectiveSelectedListId)
    }
    setDraggedTaskId(null)
    setDragOverColumnId(null)
  }

  const handleColumnDrop = (droppedOnId: string) => {
    if (!canManageColumns) return
    if (draggedColumnId && draggedColumnId !== droppedOnId) {
      void reorderColumns(effectiveSelectedListId, draggedColumnId, droppedOnId)
    }
    setDraggedColumnId(null)
  }

  const handleMoveColumn = (columnId: string, offset: -1 | 1) => {
    if (!canManageColumns) return
    const columnIndex = columnsForList.findIndex((column) => column.id === columnId)
    const targetColumn = columnsForList[columnIndex + offset]
    if (targetColumn) {
      void reorderColumns(effectiveSelectedListId, columnId, targetColumn.id)
    }
  }

  const handleAddColumn = (event?: React.FormEvent) => {
    event?.preventDefault()
    if (!canManageColumns) return
    const name = newColumnName.trim()
    if (!name || !effectiveSelectedListId) return

    void addColumn(effectiveSelectedListId, name)
    setNewColumnName('')
    setIsAddingColumn(false)
  }

  if (availableLists.length === 0) {
    return (
      <AppPage>
        <AppPageHeader title={t('nav.board')} subtitle={t('board.title')} hideOnMobile={false} />
        <AppPageMain className="py-4 md:py-6">
          <EmptyState title={t('board.noLists')} />
        </AppPageMain>
      </AppPage>
    )
  }

  return (
    <AppPage>
      <AppPageHeader
        title={t('nav.board')}
        subtitle={selectedList?.name ?? t('board.title')}
        hideOnMobile={false}
        containerClassName="max-w-none"
        actions={
          <select
            aria-label={t('board.selectList')}
            value={effectiveSelectedListId}
            onChange={(event) => {
              setSelectedListId(event.target.value)
              setIsAddingColumn(false)
              setNewColumnName('')
            }}
            className="h-10 max-w-44 truncate rounded-lg border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-56"
          >
            {availableLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
        }
      />

      <AppPageMain className="py-4 md:max-w-none md:py-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 px-1 text-xs text-muted-foreground md:px-2">
          <span className="rounded-full border border-border/60 bg-card px-2.5 py-1">
            {tasksForList.length === 1
              ? t('taskList.summary.tasks', { count: tasksForList.length })
              : t('taskList.summary.tasks_plural', { count: tasksForList.length })}
          </span>
          {!canManageColumns && (
            <span className="max-w-full rounded-full border border-border/60 bg-muted/50 px-2.5 py-1">
              {t('taskDetail.sharedReadOnly')}
            </span>
          )}
        </div>

        <div
          className="flex flex-col gap-4 px-1 pb-3 md:flex-row md:gap-5 md:overflow-x-auto md:px-2 md:snap-x md:snap-mandatory"
          onDragEnd={() => {
            setDraggedColumnId(null)
            setDragOverColumnId(null)
          }}
        >
          {columnsForList.map((column, columnIndex) => {
            const columnTasks = tasksForList
              .filter(
                (task) =>
                  task.columnId === column.id ||
                  (!task.columnId && columnsForList.findIndex((item) => item.id === column.id) === 0),
              )
              .filter(
                (task, index, self) => self.findIndex((candidate) => candidate.id === task.id) === index,
              )

            return (
              <div
                key={column.id}
                onDrop={() => {
                  handleColumnDrop(column.id)
                  setDragOverColumnId(null)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  if (draggedColumnId && draggedColumnId !== column.id) {
                    setDragOverColumnId(column.id)
                  }
                }}
                onDragLeave={() => setDragOverColumnId(null)}
                className={`rounded-xl p-1 transition-[background-color,opacity,transform] duration-150 motion-reduce:transition-none md:snap-start ${
                  draggedColumnId === column.id ? 'opacity-40' : ''
                } ${
                  draggedColumnId && dragOverColumnId === column.id
                    ? 'bg-primary/10 ring-1 ring-primary/20'
                    : ''
                }`}
              >
                <BoardColumn
                  column={column}
                  tasks={columnTasks}
                  onTaskDragStart={setDraggedTaskId}
                  onDropOnColumn={handleDropOnColumn}
                  onOpenTaskForm={onOpenTaskForm}
                  onColumnDragStart={(columnId) => {
                    if (canManageColumns) setDraggedColumnId(columnId)
                  }}
                  columns={columnsForList}
                  onMoveTask={(taskId, columnId) => {
                    if (canManageColumns) {
                      void moveTaskToColumn(taskId, columnId, effectiveSelectedListId)
                    }
                  }}
                  onMoveColumn={(offset) => handleMoveColumn(column.id, offset)}
                  canMoveUp={columnIndex > 0}
                  canMoveDown={columnIndex < columnsForList.length - 1}
                  canManageColumns={canManageColumns}
                />
              </div>
            )
          })}

          {canManageColumns && (
            <div className="flex min-h-[180px] w-full flex-col p-1 md:min-h-[calc(100dvh-220px)] md:w-72 md:shrink-0 md:snap-start">
              {isAddingColumn ? (
                <form
                  onSubmit={handleAddColumn}
                  className="flex flex-1 flex-col rounded-xl border border-primary/30 bg-card p-3 shadow-sm"
                >
                  <Input
                    autoFocus
                    value={newColumnName}
                    onChange={(event) => setNewColumnName(event.target.value)}
                    placeholder={t('board.columnName')}
                    className="h-10"
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <Button type="submit" size="sm" disabled={!newColumnName.trim()}>
                      {t('board.add')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAddingColumn(false)
                        setNewColumnName('')
                      }}
                    >
                      {t('board.cancel')}
                    </Button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingColumn(true)}
                  className="flex min-h-[160px] w-full flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 text-sm font-medium text-muted-foreground transition-[border-color,background-color,color] hover:border-primary/50 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>{t('board.addColumn')}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </AppPageMain>
    </AppPage>
  )
}

export default BoardView
