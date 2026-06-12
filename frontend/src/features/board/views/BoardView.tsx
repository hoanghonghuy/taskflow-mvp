'use client'

import React, { useState, useMemo } from 'react'
import { useTaskManager, useTaskActions, useColumnActions } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/i18n/hooks'
import BoardColumn from '@/features/board/components/BoardColumn'
import { PlusIcon } from '@/lib/icons'
import { AppPage, AppPageContainer, AppPageMain } from '@/components/layout/app-page'

interface BoardViewProps {
  onOpenTaskForm?: (defaultValues?: { listId?: string; columnId?: string }) => void
}

const BoardView: React.FC<BoardViewProps> = ({ onOpenTaskForm }) => {
  const { state } = useTaskManager()
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
    return state.columns.filter(c => c.listId === selectedListId)
  }, [state.columns, selectedListId])

  const tasksForList = useMemo(() => {
    return state.tasks.filter(t => t.listId === selectedListId)
  }, [state.tasks, selectedListId])

  const handleTaskDragStart = (taskId: string) => {
    setDraggedTaskId(taskId)
  }

  const handleDropOnColumn = (columnId: string) => {
    if (draggedTaskId) {
      void moveTaskToColumn(draggedTaskId, columnId, selectedListId)
    }
    setDraggedTaskId(null)
    setDragOverColumnId(null)
  }

  const handleColumnDragStart = (columnId: string) => {
    setDraggedColumnId(columnId)
  }

  const handleColumnDrop = (droppedOnId: string) => {
    if (draggedColumnId && draggedColumnId !== droppedOnId) {
      void reorderColumns(selectedListId, draggedColumnId, droppedOnId)
    }
    setDraggedColumnId(null)
  }

  const handleAddColumn = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (newColumnName.trim() && selectedListId) {
      void addColumn(selectedListId, newColumnName.trim())
      setNewColumnName('')
      setIsAddingColumn(false)
    }
  }

  if (availableLists.length === 0) {
    return (
      <AppPage>
        <AppPageContainer>
          <header className="py-6 border-b border-border shrink-0 hidden md:block">
            <h1 className="text-3xl font-bold">{t('nav.board')}</h1>
            <p className="text-muted-foreground">{t('board.title')}</p>
          </header>
        </AppPageContainer>
        <AppPageMain className="py-6">
          <div className="text-center text-muted-foreground">
            <p>{t('board.noLists')}</p>
          </div>
        </AppPageMain>
      </AppPage>
    )
  }

  return (
    <AppPage>
      <AppPageContainer>
        <header className="py-4 md:py-6 border-b border-border shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="hidden md:block">
              <h1 className="text-2xl md:text-3xl font-bold">{t('nav.board')}</h1>
              <p className="text-sm md:text-base text-muted-foreground">{t('board.title')}</p>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
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
            </div>
          </div>
        </header>
      </AppPageContainer>
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
                />
              </div>
            )
          })}
          <div className="w-full md:w-72 md:shrink-0">
            {isAddingColumn ? (
              <form onSubmit={handleAddColumn} className="bg-card border border-border p-2 rounded-lg h-full flex flex-col">
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
                className="w-full h-full min-h-[200px] border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>{t('board.addColumn')}</span>
              </button>
            )}
          </div>
        </div>
      </AppPageMain>
    </AppPage>
  )
}

export default BoardView
