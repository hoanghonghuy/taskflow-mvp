'use client'

import React, { useState, useMemo } from 'react'
import { useTaskManager, useTaskActions, useColumnActions } from '@/components/providers/task-manager-provider'
import { useUser } from '@/components/providers/user-provider'
import { useI18n } from '@/lib/i18n/hooks'
import BoardColumn from '@/features/board/components/BoardColumn'
import { PlusIcon } from '@/lib/icons'
import { AppPage, AppPageMain } from '@/components/layout/app-page'
import { AppPageHeader } from '@/components/layout/app-page-header'
import { EmptyState } from '@/components/ui/empty-state'
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
  const initialListId = state.lists.find(l => l.id !== 'inbox')?.id || state.lists[0]?.id || ''
  const [selectedListId, setSelectedListId] = useState<string>(() => initialListId)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)
  const [newColumnName, setNewColumnName] = useState('')
  const [isAddingColumn, setIsAddingColumn] = useState(false)

  const availableLists = useMemo(() => state.lists.filter(l => l.id !== 'inbox'), [state.lists])

  const handleListChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedListId(e.target.value)
  }

  const columnsForList = useMemo(() => {
    const selectedList = state.lists.find((list) => list.id === selectedListId)
    const listTasks = state.tasks.filter((task) => task.listId === selectedListId)
    const isSharedMemberView = isSharedListMember(selectedList, user?.id)

    if (!isSharedMemberView) {
      return state.columns.filter((column) => column.listId === selectedListId)
    }

    const fallbackColumns = selectedList
      ? buildBoardColumns([selectedList], listTasks).filter((column) => column.listId === selectedListId)
      : []
    const merged = new Map<string, Column>()
    for (const column of fallbackColumns) {
      merged.set(column.id, column)
    }
    for (const column of state.columns) {
      if (column.listId === selectedListId) {
        merged.set(column.id, column)
      }
    }
    return [...merged.values()]
  }, [state.columns, state.lists, state.tasks, selectedListId, user?.id])

  const canManageColumns = useMemo(() => {
    const selectedList = state.lists.find((list) => list.id === selectedListId)
    return !isSharedListMember(selectedList, user?.id)
  }, [state.lists, selectedListId, user?.id])

  const tasksForList = useMemo(() => {
    return state.tasks.filter(t => t.listId === selectedListId)
  }, [state.tasks, selectedListId])

  const handleTaskDragStart = (taskId: string) => {
    setDraggedTaskId(taskId)
  }

  const handleDropOnColumn = (columnId: string) => {
    if (!canManageColumns) {
      setDraggedTaskId(null)
      setDragOverColumnId(null)
      return
    }
    if (draggedTaskId) {
      void moveTaskToColumn(draggedTaskId, columnId, selectedListId)
    }
    setDraggedTaskId(null)
    setDragOverColumnId(null)
  }

  const handleColumnDragStart = (columnId: string) => {
    if (!canManageColumns) return
    setDraggedColumnId(columnId)
  }

  const handleColumnDrop = (droppedOnId: string) => {
    if (!canManageColumns) return
    if (draggedColumnId && draggedColumnId !== droppedOnId) {
      void reorderColumns(selectedListId, draggedColumnId, droppedOnId)
    }
    setDraggedColumnId(null)
  }

  const handleAddColumn = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!canManageColumns) return
    if (newColumnName.trim() && selectedListId) {
      void addColumn(selectedListId, newColumnName.trim())
      setNewColumnName('')
      setIsAddingColumn(false)
    }
  }

  if (availableLists.length === 0) {
    return (
      <AppPage>
        <AppPageHeader title={t('nav.board')} subtitle={t('board.title')} />
        <AppPageMain className="py-6">
          <EmptyState title={t('board.noLists')} />
        </AppPageMain>
      </AppPage>
    )
  }

  return (
    <AppPage>
      <AppPageHeader
        title={t('nav.board')}
        subtitle={t('board.title')}
        hideOnMobile={true}
        actionsAlwaysVisible
        containerClassName="max-w-none"
        actions={
          <select
            value={selectedListId}
            onChange={handleListChange}
            className="w-full sm:w-auto px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base text-foreground dark:bg-card dark:text-foreground"
          >
            {availableLists.map(list => {
              const listKey =
                list.id === 'inbox' ? 'specialLists.inbox' :
                list.id === 'list-1' ? 'lists.work' :
                list.id === 'list-2' ? 'lists.personal' :
                list.id === 'list-3' ? 'lists.shopping' :
                list.id === 'list-4' ? 'lists.healthFitness' :
                list.id === 'list-5' ? 'lists.learning' : null

              return (
                <option key={list.id} value={list.id}>
                  {listKey ? t(listKey) : list.name}
                </option>
              )
            })}
          </select>
        }
      />
      <AppPageMain className="py-4 md:py-6 md:max-w-none">
        <div
          className="flex flex-col md:flex-row gap-4 md:gap-6 md:overflow-x-auto px-1 md:px-2 pb-2"
          onDragEnd={() => {
            setDraggedColumnId(null)
            setDragOverColumnId(null)
          }}
        >
          {columnsForList.map(column => {
            const columnTasks = tasksForList.filter(
              t => t.columnId === column.id || (!t.columnId && columnsForList.findIndex(c => c.id === column.id) === 0)
            )
            return (
              <div
                key={column.id}
                onDrop={() => {
                  handleColumnDrop(column.id)
                  setDragOverColumnId(null)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (draggedColumnId && draggedColumnId !== column.id) {
                    setDragOverColumnId(column.id)
                  }
                }}
                onDragLeave={() => {
                  setDragOverColumnId(null)
                }}
                className={`
                  transition-all duration-200 p-1 rounded-lg
                  ${draggedColumnId === column.id ? 'opacity-30' : ''}
                  ${draggedColumnId && dragOverColumnId === column.id ? 'bg-primary/10' : ''}
                `}
              >
                <BoardColumn
                  column={column}
                  tasks={columnTasks}
                  onTaskDragStart={handleTaskDragStart}
                  onDropOnColumn={handleDropOnColumn}
                  onOpenTaskForm={onOpenTaskForm}
                  onColumnDragStart={handleColumnDragStart}
                  canManageColumns={canManageColumns}
                />
              </div>
            )
          })}
          {canManageColumns && (
          <div className="w-full md:w-72 md:shrink-0 flex flex-col min-h-[260px] md:min-h-[calc(100vh-220px)] p-1">
            {isAddingColumn ? (
              <form onSubmit={handleAddColumn} className="bg-card border border-border p-3 rounded-xl flex-1 flex flex-col shadow-sm">
                <input
                  autoFocus
                  type="text"
                  value={newColumnName}
                  onChange={e => setNewColumnName(e.target.value)}
                  placeholder={t('board.columnName')}
                  className="w-full p-2 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mb-2"
                />
                <div className="flex items-center gap-2 mt-auto">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90"
                  >
                    {t('board.add')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingColumn(false)
                      setNewColumnName('')
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t('board.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="w-full flex-1 min-h-[200px] border-2 border-dashed border-border rounded-xl bg-muted/30 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
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
