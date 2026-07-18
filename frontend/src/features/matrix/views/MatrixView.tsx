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
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

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
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onTaskDragStart: (taskId: string) => void
  onTaskDragEnd: () => void
}

/** Board-style column: equal-height card, header strip, scroll body. */
const Quadrant: React.FC<QuadrantProps> = ({
  config,
  tasks,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onTaskDragStart,
  onTaskDragEnd,
}) => {
  const { t } = useI18n()

  return (
    <TaskColumnShell
      variant="matrix"
      isDragOver={isDragOver}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <TaskColumnHeader className="items-start">
        <span
          className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', config.accent)}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{t(config.titleKey)}</h3>
            <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {t(config.priorityLabelKey)}
            </span>
            <CountBadge count={tasks.length} className="ml-auto" />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{t(config.subtitleKey)}</p>
        </div>
      </TaskColumnHeader>
      <TaskColumnBody>
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} onDragEnd={onTaskDragEnd}>
              <TaskItem
                task={task}
                isDraggable
                onDragStart={onTaskDragStart}
              />
            </div>
          ))
        ) : (
          <EmptyState compact title={t('matrix.empty')} className="h-full" />
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
      const targetId = quadrant?.id ?? 'notUrgentNotImportant'
      map[targetId].push(task)
    })

    return map
  }, [tasks])

  const handleTaskDragStart = (taskId: string) => {
    setDraggedTaskId(taskId.split('_')[0])
  }

  const handleTaskDragEnd = () => {
    setDraggedTaskId(null)
    setDragOverQuadrantId(null)
  }

  const handleQuadrantDragOver = (e: React.DragEvent, quadrantId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverQuadrantId(quadrantId)
  }

  const handleQuadrantDrop = (e: React.DragEvent, dropPriority: Priority) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId') || draggedTaskId
    if (!taskId) return

    const task = state.tasks.find((item) => item.id === taskId)
    if (!task || task.priority === dropPriority) {
      handleTaskDragEnd()
      return
    }

    const parentList = state.lists.find((list) => list.id === task.listId)
    if (isSharedListMember(parentList, user?.id)) {
      handleTaskDragEnd()
      return
    }

    void updateTask({ ...task, priority: dropPriority }, { silent: true })
    handleTaskDragEnd()
  }

  return (
    <AppPage>
      <AppPageHeader
        title={t('matrix.title')}
        subtitle={t('matrix.subtitle')}
        hint={t('matrix.dragHint')}
        containerClassName="max-w-none"
      />
      <AppPageMain className="h-full py-4 md:max-w-none md:py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
          {QUADRANT_CONFIG.map((config) => (
            <Quadrant
              key={config.id}
              config={config}
              tasks={tasksByQuadrant[config.id] || []}
              isDragOver={dragOverQuadrantId === config.id}
              onDragOver={(e) => handleQuadrantDragOver(e, config.id)}
              onDragLeave={() => setDragOverQuadrantId((prev) => (prev === config.id ? null : prev))}
              onDrop={(e) => handleQuadrantDrop(e, config.dropPriority)}
              onTaskDragStart={handleTaskDragStart}
              onTaskDragEnd={handleTaskDragEnd}
            />
          ))}
        </div>
      </AppPageMain>
    </AppPage>
  )
}

export default MatrixView
