'use client'

import React, { useMemo, useState, useCallback } from 'react'
import TaskItem from './TaskItem'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import type { Task } from '@/types'
import { PlusIcon, EMPTY_STATE_ILLUSTRATIONS, ArrowUpIcon, ArrowDownIcon } from '@/lib/constants'
import { useI18n } from '@/lib/hooks/use-i18n'
import { filterTasksByList, sortTasks, groupUpcomingTasks } from '@/lib/utils/task-helpers'
import { isSameDay, startOfDay, endOfDay } from '@/lib/utils/date-helpers'

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

  const summary = useMemo(() => {
    const today = startOfDay(new Date())
    const endOfWeek = endOfDay(startOfDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)))

    return filteredTasks.reduce(
      (acc, task) => {
        if (!task.dueDate || task.completed) {
          return acc
        }

        const dueDate = startOfDay(new Date(task.dueDate))

        if (isSameDay(dueDate, today)) {
          acc.today += 1
        } else if (dueDate < today) {
          acc.overdue += 1
        } else if (dueDate <= endOfWeek) {
          acc.upcoming += 1
        }

        return acc
      },
      { today: 0, upcoming: 0, overdue: 0, total: filteredTasks.length }
    )
  }, [filteredTasks])

  const formatTaskCount = useCallback(
    (count: number) =>
      count === 1
        ? t('taskList.summary.tasks', { count })
        : t('taskList.summary.tasks_plural', { count }),
    [t]
  )

  const summaryCards = useMemo(
    () => [
      {
        key: 'today',
        label: t('taskList.summary.today'),
        value: summary.today,
        accent: 'bg-primary/10 text-primary'
      },
      {
        key: 'upcoming',
        label: t('taskList.summary.upcoming'),
        value: summary.upcoming,
        accent: 'bg-blue-500/10 text-blue-500'
      },
      {
        key: 'overdue',
        label: t('taskList.summary.overdue'),
        value: summary.overdue,
        accent: 'bg-destructive/10 text-destructive'
      },
      {
        key: 'total',
        label: t('taskList.summary.total'),
        value: summary.total,
        accent: 'bg-muted text-muted-foreground'
      }
    ],
    [summary, t]
  )

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
    <div className="space-y-6">
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map(({ key, label, value, accent }) => (
          <div
            key={key}
            className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
            <div className="flex items-end justify-between gap-2">
              <span className="text-2xl font-semibold">{value}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${accent}`}>
                {formatTaskCount(value)}
              </span>
            </div>
          </div>
        ))}
      </section>

      <div
        onDragOver={(e) => e.preventDefault()}
        className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm"
      >
        {groupedUpcomingTasks ? (
          upcomingGroupOrder.map(groupName => (
            groupedUpcomingTasks[groupName] && (
              <div key={groupName} className="mb-6">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{groupName}</h3>
                  <span className="text-xs text-muted-foreground/80">{formatTaskCount(groupedUpcomingTasks[groupName].length)}</span>
                </div>
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
        <div className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm">
          <button 
            onClick={() => setIsCompletedOpen(!isCompletedOpen)}
            className="w-full flex items-center justify-between text-sm font-semibold text-muted-foreground py-1"
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


