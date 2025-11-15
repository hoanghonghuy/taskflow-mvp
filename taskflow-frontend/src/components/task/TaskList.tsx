'use client'

import React, { useMemo, useState } from 'react'
import TaskItem from './TaskItem'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import type { Task } from '@/types'
import { PlusIcon, EMPTY_STATE_ILLUSTRATIONS, ArrowUpIcon, ArrowDownIcon } from '@/lib/constants'
import { useI18n } from '@/lib/hooks/use-i18n'
import { filterTasksByList, sortTasks, groupUpcomingTasks, type SortOrder } from '@/lib/utils/task-helpers'

interface TaskListProps {
  onAddTask?: () => void
}

const TaskList: React.FC<TaskListProps> = ({ onAddTask }) => {
  const { state } = useTaskManager()
  const { t } = useI18n()
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [isCompletedOpen, setIsCompletedOpen] = useState(false)

  const filteredTasks = useMemo(() => {
    return filterTasksByList(state.tasks, state.activeListId, state.activeTag)
  }, [state.tasks, state.activeListId, state.activeTag])

  const uncompletedTasks = useMemo(() => {
    return sortTasks(
      filteredTasks.filter(task => !task.completed),
      state.sortOrder,
      state.tasks
    )
  }, [filteredTasks, state.sortOrder, state.tasks])

  const completedTasks = useMemo(() => {
    return sortTasks(
      filteredTasks.filter(task => task.completed),
      state.sortOrder,
      state.tasks
    )
  }, [filteredTasks, state.sortOrder, state.tasks])

  const groupedUpcomingTasks = useMemo(() => {
    if (state.activeListId !== 'upcoming') return null
    return groupUpcomingTasks(uncompletedTasks, t)
  }, [state.activeListId, uncompletedTasks, t])

  const upcomingGroupOrder = useMemo(() => {
    if (!groupedUpcomingTasks) return []
    return Object.keys(groupedUpcomingTasks).sort((a, b) => {
      const earliestA = Math.min(...groupedUpcomingTasks[a].map(t => new Date(t.dueDate!).getTime()))
      const earliestB = Math.min(...groupedUpcomingTasks[b].map(t => new Date(t.dueDate!).getTime()))
      return earliestA - earliestB
    })
  }, [groupedUpcomingTasks])

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId)
  }

  const handleDrop = (droppedOnId: string) => {
    if (draggedTaskId && draggedTaskId !== droppedOnId) {
      // TODO: Implement reorder action
      console.log('Reorder task', draggedTaskId, droppedOnId)
    }
    setDraggedTaskId(null)
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
        {EMPTY_STATE_ILLUSTRATIONS.noTasks}
        <h2 className="text-xl font-semibold mt-4">{t('taskList.allDone')}</h2>
        <p className="text-sm mt-2">{t('taskList.noTasks')}</p>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="mt-6 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>{t('taskList.addTask')}</span>
          </button>
        )}
      </div>
    )
  }

  const renderTaskItems = (tasks: Task[]) => (
    tasks.map(task => (
      <TaskItem 
        key={task.id} 
        task={task}
        isDraggable={state.sortOrder === 'default' && state.activeListId !== 'upcoming'}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
      />
    ))
  )

  return (
    <div className="space-y-4">
      <div onDragOver={(e) => e.preventDefault()}>
        {groupedUpcomingTasks ? (
          upcomingGroupOrder.map(groupName => (
            groupedUpcomingTasks[groupName] && (
              <div key={groupName} className="mb-6">
                <h3 className="text-md font-semibold mb-2 text-primary">{groupName}</h3>
                <div className="space-y-2">
                  {renderTaskItems(groupedUpcomingTasks[groupName])}
                </div>
              </div>
            )
          ))
        ) : (
          <div className="space-y-2">
            {renderTaskItems(uncompletedTasks)}
          </div>
        )}
        {onAddTask && (
          <button 
            onClick={onAddTask}
            className="w-full flex items-center gap-2 p-3 mt-4 rounded-lg text-primary hover:bg-primary/10 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="text-sm font-semibold">{t('taskList.addTask')}</span>
          </button>
        )}
      </div>
      {completedTasks.length > 0 && (
        <div>
          <button 
            onClick={() => setIsCompletedOpen(!isCompletedOpen)}
            className="w-full flex items-center justify-between text-sm font-semibold text-muted-foreground mb-2 py-1"
          >
            <span>{t('taskList.completed')} ({completedTasks.length})</span>
            {isCompletedOpen ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
          </button>
          {isCompletedOpen && (
            <div className="space-y-2 animate-accordion-down overflow-hidden">
              {completedTasks.map(task => (
                <TaskItem key={task.id} task={task} isDraggable={false} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TaskList


