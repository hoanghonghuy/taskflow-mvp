'use client'

import React, { useMemo, useState } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useUser } from '@/components/providers/user-provider'
import { useTaskActions } from '@/lib/hooks/use-task-manager'
import { useI18n } from '@/lib/i18n/hooks'
import TaskItem from '@/features/tasks/components/TaskItem'
import type { Task, Priority } from '@/types'
import { AppPage, AppPageMain } from '@/components/layout/app-page'
import { AppPageHeader } from '@/components/layout/app-page-header'
import {
  CountBadge,
  TaskColumnBody,
  TaskColumnHeader,
  TaskColumnShell,
} from '@/components/layout/task-column-shell'
import { isSharedListMember } from '@/lib/utils/list-access'
import { TaskMoveControl } from '@/components/ui/task-move-control'
import { cn } from '@/lib/utils'
import type { TranslationKey } from '@/lib/i18n/types'

interface QuadrantConfig {
  id: string
  priorities: Priority[]
  dropPriority: Priority
  accent: string
  titleKey: 'matrix.q1.title' | 'matrix.q2.title' | 'matrix.q3.title' | 'matrix.q4.title'
  subtitleKey: 'matrix.q1.subtitle' | 'matrix.q2.subtitle' | 'matrix.q3.subtitle' | 'matrix.q4.subtitle'
  priorityLabelKey: 'matrix.priorities.high' | 'matrix.priorities.low' | 'matrix.priorities.medium' | 'matrix.priorities.none'
}

interface QuadrantProps {
  config: QuadrantConfig
  tasks: Task[]
  isDragOver: boolean
  onDragOver: (event: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (event: React.DragEvent) => void
  onTaskDragStart: (taskId: string) => void
  onTaskDragEnd: () => void
  quadrants: QuadrantConfig[]
  onMoveTask: (taskId: string, quadrantId: string) => void
  canMoveTask: (task: Task) => boolean
}

const Quadrant: React.FC<QuadrantProps> = ({
  config,
  tasks,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onTaskDragStart,
  onTaskDragEnd,
  quadrants,
  onMoveTask,
  canMoveTask,
}) => {
  const { t } = useI18n()

  return (
    <TaskColumnShell
      variant="matrix"
      isDragOver={isDragOver}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        'overflow-hidden transition-[border-color,box-shadow,background-color] duration-150 motion-reduce:transition-none',
        isDragOver && 'ring-2 ring-primary/20 ring-offset-2 ring-offset-background',
      )}
    >
      <TaskColumnHeader className="min-h-16 items-start px-4 py-3">
        <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', config.accent)} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 truncate text-sm font-semibold text-foreground">
              {t(config.titleKey)}
            </h2>
            <CountBadge count={tasks.length} className="ml-auto shrink-0" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-border/70 bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {t(config.priorityLabelKey)}
            </span>
            <p className="text-xs text-muted-foreground">{t(config.subtitleKey)}</p>
          </div>
        </div>
      </TaskColumnHeader>

      <TaskColumnBody className={tasks.length === 0 ? 'flex items-center justify-center p-3' : 'p-3'}>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="group" onDragEnd={onTaskDragEnd}>
              <TaskItem task={task} isDraggable={canMoveTask(task)} onDragStart={onTaskDragStart} />
              {canMoveTask(task) ? (
                <TaskMoveControl
                  label={t('matrix.changePriority' as TranslationKey)}
                  value={config.id}
                  options={quadrants.map((quadrant) => ({
                    value: quadrant.id,
                    label: t(quadrant.titleKey),
                  }))}
                  onMove={(quadrantId) => onMoveTask(task.id, quadrantId)}
                />
              ) : null}
            </div>
          ))
        ) : (
          <div
            className={cn(
              'flex min-h-32 w-full items-center justify-center rounded-xl border border-dashed px-4 text-center text-sm font-medium transition-[border-color,background-color,color] duration-150 motion-reduce:transition-none',
              isDragOver
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/70 bg-muted/20 text-muted-foreground',
            )}
          >
            {t('matrix.empty')}
          </div>
        )}
      </TaskColumnBody>
    </TaskColumnShell>
  )
}

const QUADRANT_CONFIG: QuadrantConfig[] = [
  {
    id: 'urgentImportant',
    priorities: ['urgent', 'high'],
    dropPriority: 'urgent',
    accent: 'bg-[hsl(var(--color-priority-high))]',
    titleKey: 'matrix.q1.title',
    subtitleKey: 'matrix.q1.subtitle',
    priorityLabelKey: 'matrix.priorities.high',
  },
  {
    id: 'notUrgentImportant',
    priorities: ['low'],
    dropPriority: 'low',
    accent: 'bg-[hsl(var(--color-priority-low))]',
    titleKey: 'matrix.q2.title',
    subtitleKey: 'matrix.q2.subtitle',
    priorityLabelKey: 'matrix.priorities.low',
  },
  {
    id: 'urgentNotImportant',
    priorities: ['medium'],
    dropPriority: 'medium',
    accent: 'bg-[hsl(var(--color-priority-medium))]',
    titleKey: 'matrix.q3.title',
    subtitleKey: 'matrix.q3.subtitle',
    priorityLabelKey: 'matrix.priorities.medium',
  },
  {
    id: 'notUrgentNotImportant',
    priorities: ['none'],
    dropPriority: 'none',
    accent: 'bg-muted-foreground/50',
    titleKey: 'matrix.q4.title',
    subtitleKey: 'matrix.q4.subtitle',
    priorityLabelKey: 'matrix.priorities.none',
  },
]

const MatrixView: React.FC = () => {
  const { state } = useTaskManager()
  const { updateTask } = useTaskActions()
  const { user } = useUser()
  const { t } = useI18n()
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverQuadrantId, setDragOverQuadrantId] = useState<string | null>(null)

  const tasks = state.tasks.filter((task) => !task.completed)

  const tasksByQuadrant = useMemo(() => {
    const map: Record<string, Task[]> = {}
    QUADRANT_CONFIG.forEach((config) => {
      map[config.id] = []
    })

    tasks.forEach((task) => {
      const quadrant = QUADRANT_CONFIG.find((config) =>
        config.priorities.includes((task.priority || 'none') as Priority),
      )
      map[quadrant?.id ?? 'notUrgentNotImportant'].push(task)
    })

    return map
  }, [tasks])

  const canMoveTask = (task: Task) => {
    const parentList = state.lists.find((list) => list.id === task.listId)
    return !isSharedListMember(parentList, user?.id)
  }

  const moveTaskToPriority = (taskId: string, dropPriority: Priority) => {
    const task = state.tasks.find((item) => item.id === taskId)
    if (!task || task.priority === dropPriority || !canMoveTask(task)) return
    void updateTask({ ...task, priority: dropPriority }, { silent: true })
  }

  const handleMoveTask = (taskId: string, quadrantId: string) => {
    const target = QUADRANT_CONFIG.find((config) => config.id === quadrantId)
    if (target) moveTaskToPriority(taskId, target.dropPriority)
  }

  return (
    <AppPage>
      <AppPageHeader
        title={t('matrix.title')}
        subtitle={t('matrix.subtitle')}
        hint={t('matrix.dragHint')}
        hideOnMobile={false}
        containerClassName="max-w-none"
      />

      <AppPageMain className="h-full py-4 md:max-w-none md:py-6">
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/60 bg-card px-2.5 py-1">
            {tasks.length === 1
              ? t('taskList.summary.tasks', { count: tasks.length })
              : t('taskList.summary.tasks_plural', { count: tasks.length })}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
          {QUADRANT_CONFIG.map((config) => (
            <Quadrant
              key={config.id}
              config={config}
              tasks={tasksByQuadrant[config.id] || []}
              isDragOver={dragOverQuadrantId === config.id}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setDragOverQuadrantId(config.id)
              }}
              onDragLeave={() =>
                setDragOverQuadrantId((previous) => (previous === config.id ? null : previous))
              }
              onDrop={(event) => {
                event.preventDefault()
                const taskId = event.dataTransfer.getData('taskId') || draggedTaskId
                if (taskId) moveTaskToPriority(taskId, config.dropPriority)
                setDraggedTaskId(null)
                setDragOverQuadrantId(null)
              }}
              onTaskDragStart={(taskId) => setDraggedTaskId(taskId.split('_')[0])}
              onTaskDragEnd={() => {
                setDraggedTaskId(null)
                setDragOverQuadrantId(null)
              }}
              quadrants={QUADRANT_CONFIG}
              onMoveTask={handleMoveTask}
              canMoveTask={canMoveTask}
            />
          ))}
        </div>
      </AppPageMain>
    </AppPage>
  )
}

export default MatrixView
