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
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'

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
    <EmptyState
      illustration={EMPTY_STATE_ILLUSTRATIONS.noTasks}
      title={t(copy.title)}
      description={t(copy.body)}
      action={
        onAddTask ? (
          <Button type="button" onClick={onAddTask} className="gap-2">
            <PlusIcon className="h-5 w-5" />
            <span>{t('taskList.addTask')}</span>
          </Button>
        ) : undefined
      }
    />
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
        if (!task.dueDate || task.completed) return acc

        const dueDate = startOfDay(new Date(task.dueDate))
        if (isSameDay(dueDate, today)) acc.today += 1
        else if (dueDate < today) acc.overdue += 1
        else acc.upcoming += 1
        return acc
      },
      { today: 0, upcoming: 0, overdue: 0, total: filteredTasks.length },
    )
  }, [filteredTasks])

  const uncompletedTasks = useMemo(
    () => sortTasks(filteredTasks.filter((task) => !task.completed), state.sortOrder, state.tasks),
    [filteredTasks, state.sortOrder, state.tasks],
  )

  const completedTasks = useMemo(
    () => sortTasks(filteredTasks.filter((task) => task.completed), state.sortOrder, state.tasks),
    [filteredTasks, state.sortOrder, state.tasks],
  )

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const visibleUncompletedTasks = useMemo(
    () => uncompletedTasks.slice(0, visibleCount),
    [uncompletedTasks, visibleCount],
  )

  const groupedUpcomingTasks = useMemo(() => {
    if (state.activeListId !== 'upcoming') return null
    return groupUpcomingTasks(uncompletedTasks, t, currentLanguage)
  }, [state.activeListId, uncompletedTasks, t, currentLanguage])

  const upcomingGroupOrder = useMemo(() => {
    if (!groupedUpcomingTasks) return []
    return Object.keys(groupedUpcomingTasks).sort((a, b) => {
      const earliestA = Math.min(...groupedUpcomingTasks[a].map((task) => new Date(task.dueDate!).getTime()))
      const earliestB = Math.min(...groupedUpcomingTasks[b].map((task) => new Date(task.dueDate!).getTime()))
      return earliestA - earliestB
    })
  }, [groupedUpcomingTasks])

  const formatTaskCount = useCallback(
    (count: number) =>
      count === 1
        ? t('taskList.summary.tasks', { count })
        : t('taskList.summary.tasks_plural', { count }),
    [t],
  )

  const summaryItems = useMemo(
    () => [
      { key: 'today', label: t('taskList.summary.today'), value: summary.today, tone: 'text-primary' },
      {
        key: 'upcoming',
        label: t('taskList.summary.upcoming'),
        value: summary.upcoming,
        tone: 'text-[hsl(var(--color-dashboard-upcoming))]',
      },
      { key: 'overdue', label: t('taskList.summary.overdue'), value: summary.overdue, tone: 'text-destructive' },
      { key: 'total', label: t('taskList.summary.total'), value: summary.total, tone: 'text-foreground' },
    ],
    [summary, t],
  )

  const handleDragStart = (taskId: string) => setDraggedTaskId(taskId)
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
      <div className="flex min-h-[52vh] flex-col items-center justify-center">
        <TaskListEmptyState variant={emptyStateVariant} onAddTask={onAddTask} />
      </div>
    )
  }

  const renderTaskItems = (tasks: Task[]) =>
    tasks.map((task) => (
      <TaskItem
        key={task.id}
        task={task}
        isDraggable={state.sortOrder === 'default' && state.activeListId !== 'upcoming'}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
      />
    ))

  return (
    <div className="space-y-5">
      <section
        aria-label={t('taskList.summary.total')}
        className="grid grid-cols-2 overflow-hidden rounded-xl border border-border/60 bg-card/65 sm:grid-cols-4"
      >
        {summaryItems.map(({ key, label, value, tone }, index) => (
          <div
            key={key}
            className={`px-4 py-3 sm:px-5 ${index > 0 ? 'border-l border-border/50' : ''} ${index > 1 ? 'border-t sm:border-t-0' : index === 1 ? 'border-l border-border/50' : ''}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className={`text-xl font-semibold tabular-nums ${tone}`}>{value}</span>
              <span className="text-[11px] text-muted-foreground sm:hidden">{formatTaskCount(value)}</span>
            </div>
            <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t('taskList.summary.total')}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatTaskCount(uncompletedTasks.length)}
            </p>
          </div>
          {onAddTask && (
            <Button type="button" size="sm" onClick={onAddTask} className="gap-2">
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('taskList.addTask')}</span>
            </Button>
          )}
        </div>

        <div className="p-3 sm:p-4" onDragOver={(event) => event.preventDefault()}>
          {groupedUpcomingTasks ? (
            uncompletedTasks.length === 0 ? (
              <TaskListEmptyState variant={emptyStateVariant} onAddTask={onAddTask} />
            ) : (
              upcomingGroupOrder.map(
                (groupName) =>
                  groupedUpcomingTasks[groupName] && (
                    <div key={groupName} className="mb-6 last:mb-0">
                      <div className="mb-3 flex items-baseline justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {groupName}
                        </h3>
                        <span className="text-xs text-muted-foreground/80">
                          {formatTaskCount(groupedUpcomingTasks[groupName].length)}
                        </span>
                      </div>
                      <div className="space-y-2">{renderTaskItems(groupedUpcomingTasks[groupName])}</div>
                    </div>
                  ),
              )
            )
          ) : uncompletedTasks.length === 0 ? (
            <TaskListEmptyState variant={emptyStateVariant} onAddTask={onAddTask} />
          ) : (
            <>
              <div className="space-y-2">{renderTaskItems(visibleUncompletedTasks)}</div>
              {visibleCount < uncompletedTasks.length && (
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setVisibleCount((previous) =>
                        Math.min(previous + PAGE_SIZE, uncompletedTasks.length),
                      )
                    }
                  >
                    {t('taskList.loadMore')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {completedTasks.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-border/60 bg-card/55">
          <button
            type="button"
            onClick={() => setIsCompletedOpen((open) => !open)}
            className="flex min-h-12 w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none sm:px-5"
            aria-expanded={isCompletedOpen}
          >
            <span>
              <span className="block text-sm font-semibold text-foreground">{t('taskList.completed')}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {formatTaskCount(completedTasks.length)}
              </span>
            </span>
            {isCompletedOpen ? (
              <ArrowUpIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {isCompletedOpen && (
            <div className="space-y-2 border-t border-border/50 p-3 animate-accordion-down overflow-hidden sm:p-4 motion-reduce:animate-none">
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} isDraggable={false} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default TaskList
