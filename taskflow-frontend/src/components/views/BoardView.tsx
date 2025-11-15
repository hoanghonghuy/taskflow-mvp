'use client'

import React, { useState, useMemo } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import TaskItem from '@/components/task/TaskItem'
import { PlusIcon, GripVerticalIcon } from '@/lib/constants'
import type { Task, Column } from '@/types'

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

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
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
            <p>{t('board.noLists') || 'No lists available. Create a list first.'}</p>
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
              className="w-full sm:w-auto px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
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
      <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {columnsForList.map(column => {
            const columnTasks = tasksForList.filter(t => t.columnId === column.id)
            const isDragOver = dragOverColumnId === column.id

            return (
              <div
                key={column.id}
                className={`
                  flex-shrink-0 w-72 md:w-80 bg-card border border-border rounded-lg p-3 md:p-4 flex flex-col
                  ${isDragOver ? 'border-primary border-2' : ''}
                  transition-all
                `}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (draggedTaskId) {
                    setDragOverColumnId(column.id)
                  }
                }}
                onDragLeave={() => {
                  if (draggedTaskId) {
                    setDragOverColumnId(null)
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  handleDropOnColumn(column.id)
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{column.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                      {columnTasks.length}
                    </span>
                    <button
                      onClick={() => handleDeleteColumn(column.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Delete column"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="flex-1 space-y-2 min-h-[200px]">
                  {columnTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      isDraggable={true}
                      onDragStart={handleTaskDragStart}
                      onDrop={() => {}}
                    />
                  ))}
                  {onOpenTaskForm && (
                    <button
                      onClick={() => onOpenTaskForm({ listId: selectedListId, columnId: column.id })}
                      className="w-full p-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                    >
                      <PlusIcon className="h-5 w-5" />
                      <span className="text-sm">{t('board.addTask') || 'Add Task'}</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {isAddingColumn ? (
            <div className="flex-shrink-0 w-72 md:w-80 bg-card border border-border rounded-lg p-3 md:p-4">
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddColumn()
                  } else if (e.key === 'Escape') {
                    setIsAddingColumn(false)
                    setNewColumnName('')
                  }
                }}
                placeholder={t('board.columnName') || 'Column name'}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-2 text-sm md:text-base"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddColumn}
                  className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm md:text-base"
                >
                  {t('board.add') || 'Add'}
                </button>
                <button
                  onClick={() => {
                    setIsAddingColumn(false)
                    setNewColumnName('')
                  }}
                  className="flex-1 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-muted transition-colors text-sm md:text-base"
                >
                  {t('board.cancel') || 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingColumn(true)}
              className="flex-shrink-0 w-72 md:w-80 border-2 border-dashed border-border rounded-lg p-3 md:p-4 text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <PlusIcon className="h-5 w-5" />
              <span>{t('board.addColumn') || 'Add Column'}</span>
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

export default BoardView

