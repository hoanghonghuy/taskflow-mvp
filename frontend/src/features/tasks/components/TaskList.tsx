'use client'

import React, { useMemo, useState, useCallback } from 'react'
import TaskItem from './TaskItem'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useTaskActions } from '@/lib/hooks/use-task-manager'
import type { Task } from '@/types'
import { PlusIcon, ArrowUpIcon, ArrowDownIcon } from '@/lib/icons'
import { EMPTY_STATE_ILLUSTRATIONS } from '@/lib/task-constants'
import { useI18n } from '@/lib/i18n/hooks'
import { filterTasksByList, sortTasks, groupUpcomingTasks } from '@/lib/utils/task-helpers'
import { isSameDay, startOfDay } from '@/lib/utils/date-helpers'
import type { TranslationKey } from '@/lib/i18n/types'

interface TaskListProps {
  onAddTask?: () => void
}

const PAGE_SIZE = 50

type EmptyStateVariant = 'today' | 'upcoming' | 'inbox' | 'tag' | 'default' | 'allCompleted'

const EMPTY_STATE_KEYS: Record<EmptyStateVariant, { title: TranslationKey; body: TranslationKey }> = {
  today: { title: 'taskList.empty.today.title', body: 'taskList.empty.today.body' },
  upcoming: { title: 'taskList.empty.upcoming.title', body: 'taskList.empty.upcoming.body' },
  inbox: { title: 'taskList.empty.inbox.title', body: 'taskList.empty.inbox.body' },
  tag: { title: 'taskList.empty.tag.title', body: 'taskList.empty.tag.body' },
  default: { title: 'taskList.empty.default.title', body: 'taskList.empty.default.body' },
  allCompleted: { title: 'taskList.empty.allCompleted.title', body: 'taskList.empty.allCompleted.body' },
}

function resolveEmptyStateVariant(
  activeListId: string | null,
  activeTag: string | null,
  hasOpenTasks: boolean,
): EmptyStateVariant {
  if (!hasOpenTasks && activeListId !== 'today' && activeListId !== 'upcoming' && activeListId !== 'inbox' && !activeTag) {
    return 'allCompleted'
  }
  if (activeTag) return 'tag'
  if (activeListId === 'today') return 'today'
  if (activeListId === 'upcoming') return 'upcoming'
  if (activeListId === 'inbox') return 'inbox'
  return 'default'
}

interface TaskListEmptyStateProps {
  variant: EmptyStateVariant
  onAddTask?: () => void
}

const TaskListEmptyState: React.FC<TaskListEmptyStateProps> = ({ variant, onAddTask }) => {
  const { t } = useI18n()
  const copy = EMPTY_STATE_KEYS[variant]

  return (
    <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12 px-4">
      {EMPTY_STATE_ILLUSTRATIONS.noTasks}
      <h2 className="text-xl font-semibold mt-4 text-foreground">{t(copy.title)}</h2>
      <p className="text-sm mt-2 max-w-sm">{t(copy.body)}</p>
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

const TaskList: React.FC<TaskListProps> = ({ onAddTask }) => {
  const { state } = useTaskManager()
  const { reorderTasks } = useTaskActions()
  const { t, currentLanguage } = useI18n()
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [isCompletedOpen, setIsCompletedOpen] = useState(false)

  const filteredTasks = useMemo(() => {
    const inboxListId = state.lists.find((l) => l.name === 'Inbox' || l.id === 'inbox')?.id ?? null
    return filterTasksByList(state.tasks, state.activeListId, state.activeTag, inboxListId)
  }, [state.tasks, state.activeListId, state.activeTag, state.lists])

  const summary = useMemo(() => {
    const today = startOfDay(new Date())

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
        } else if (dueDate > today) {
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
        accent: 'bg-[hsl(var(--color-dashboard-upcoming) / 0.1)] text-[hsl(var(--color-dashboard-upcoming))]'
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

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const visibleUncompletedTasks = useMemo(
    () => uncompletedTasks.slice(0, visibleCount),
    [uncompletedTasks, visibleCount],
  )

  const completedTasks = useMemo(() => {
    return sortTasks(
      filteredTasks.filter(task => task.completed),
      state.sortOrder,
      state.tasks
    )
  }, [filteredTasks, state.sortOrder, state.tasks])

  const groupedUpcomingTasks = useMemo(() => {
    if (state.activeListId !== 'upcoming') return null
    return groupUpcomingTasks(uncompletedTasks, t, currentLanguage)
  }, [state.activeListId, uncompletedTasks, t, currentLanguage])

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
      void reorderTasks(draggedTaskId, droppedOnId)
    }
    setDraggedTaskId(null)
  }

  const emptyStateVariant = resolveEmptyStateVariant(
    state.activeListId,
    state.activeTag,
    uncompletedTasks.length > 0,
  )

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <TaskListEmptyState variant={emptyStateVariant} onAddTask={onAddTask} />
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
          uncompletedTasks.length === 0 ? (
            <TaskListEmptyState variant={emptyStateVariant} onAddTask={onAddTask} />
          ) : (
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
          )
        ) : uncompletedTasks.length === 0 ? (
          <TaskListEmptyState variant={emptyStateVariant} onAddTask={onAddTask} />
        ) : (
          <>
            <div className="space-y-2">
              {renderTaskItems(visibleUncompletedTasks)}
            </div>
            {visibleCount < uncompletedTasks.length && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount(prev => Math.min(prev + PAGE_SIZE, uncompletedTasks.length))}
                  className="px-4 py-2 text-sm rounded-md border border-border text-muted-foreground hover:bg-secondary/80 transition-colors"
                >
                  {t('taskList.loadMore')}
                </button>
              </div>
            )}
          </>
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


