'use client'

import React, { useState, useMemo } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import BoardColumn from '@/components/board/BoardColumn'
import { PlusIcon } from '@/lib/constants'
import type { Column } from '@/types'

interface BoardViewProps {
  onOpenTaskForm?: (defaultValues?: { listId?: string; columnId?: string }) => void
}

const BoardView: React.FC<BoardViewProps> = ({ onOpenTaskForm }) => {
  const { state, dispatch } = useTaskManager()
  const { t } = useI18n()
  const [selectedListId, setSelectedListId] = useState<string>(() => state.lists[0]?.id || '')
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

  const handleTaskDragEnd = () => {
    setDraggedTaskId(null)
    setDragOverColumnId(null)
  }

  const handleDropOnColumn = (columnId: string) => {
    if (draggedTaskId) {
      dispatch({
        type: 'MOVE_TASK_TO_COLUMN',
        payload: { taskId: draggedTaskId, newColumnId: columnId, listId: selectedListId },
      })
    }
    setDraggedTaskId(null)
    setDragOverColumnId(null)
  }

  const handleColumnDragStart = (columnId: string) => {
    setDraggedColumnId(columnId)
  }

  const handleColumnDrop = (droppedOnId: string) => {
    if (draggedColumnId && draggedColumnId !== droppedOnId) {
      dispatch({
        type: 'REORDER_COLUMNS',
        payload: { listId: selectedListId, draggedId: draggedColumnId, droppedOnId },
      })
    }
    setDraggedColumnId(null)
  }

  const handleAddColumn = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (newColumnName.trim() && selectedListId) {
      dispatch({
        type: 'ADD_COLUMN',
        payload: { listId: selectedListId, name: newColumnName.trim() },
      })
      setNewColumnName('')
      setIsAddingColumn(false)
    }
  }

  const handleDeleteColumn = (columnId: string) => {
    dispatch({
      type: 'DELETE_COLUMN',
      payload: { columnId, listId: selectedListId },
    })
  }

  if (availableLists.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="p-6 border-b border-border flex-shrink-0">
          <h1 className="text-3xl font-bold">{t('nav.board')}</h1>
          <p className="text-muted-foreground">{t('board.title')}</p>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
          <div className="text-center text-muted-foreground">
            <p>{t('board.noLists')}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <header className="p-4 md:p-6 border-b border-border flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
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
                const listKey = list.id === 'inbox' ? 'specialLists.inbox' : 
                               list.id === 'list-1' ? 'lists.work' :
                               list.id === 'list-2' ? 'lists.personal' :
                               list.id === 'list-3' ? 'lists.shopping' :
                               list.id === 'list-4' ? 'lists.healthFitness' :
                               list.id === 'list-5' ? 'lists.learning' : list.name
                return (
                  <option key={list.id} value={list.id}>
                    {listKey.startsWith('specialLists.') || listKey.startsWith('lists.') ? t(listKey) : listKey}
                  </option>
                )
              })}
            </select>
          </div>
        </div>
      </header>
      <main className="flex-1 flex gap-4 overflow-x-auto bg-background p-4 md:p-6 pb-20 md:pb-6" onDragEnd={() => { setDraggedColumnId(null); setDragOverColumnId(null); }}>
        {columnsForList.map(column => {
          const columnTasks = tasksForList.filter(
            t => t.columnId === column.id || (!t.columnId && columnsForList.findIndex(c => c.id === column.id) === 0)
          )
          const isDragOver = dragOverColumnId === column.id

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
                onTaskDragEnd={handleTaskDragEnd}
                onDropOnColumn={handleDropOnColumn}
                onOpenTaskForm={onOpenTaskForm}
                onColumnDragStart={handleColumnDragStart}
              />
            </div>
          )
        })}
        <div className="w-72 flex-shrink-0">
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
      </main>
    </div>
  )
}

export default BoardView

