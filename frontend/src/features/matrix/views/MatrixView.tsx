'use client'

import React, { useMemo, useState } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useTaskActions } from '@/lib/hooks/use-task-manager'
import { useI18n } from '@/lib/i18n/hooks'
import TaskItem from '@/features/tasks/components/TaskItem'
import type { Task, Priority } from '@/types'
import { AppPage, AppPageContainer, AppPageMain } from '@/components/layout/app-page'

interface QuadrantConfig {
  id: string
  priorities: Priority[]
  dropPriority: Priority
  border: string
  background: string
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
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`
        p-4 rounded-xl flex flex-col border transition-all
        ${config.border} ${config.background}
        ${isDragOver ? 'ring-2 ring-primary/60 shadow-lg' : ''}
      `}
    >
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold">{t(config.titleKey)}</h3>
          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-background/80 text-muted-foreground border border-border">
            {t(config.priorityLabelKey)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{t(config.subtitleKey)}</p>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-2 min-h-[120px]">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <div key={task.id} onDragEnd={onTaskDragEnd}>
              <TaskItem
                task={task}
                isDraggable
                onDragStart={onTaskDragStart}
              />
            </div>
          ))
        ) : (
          <div className="text-center text-sm text-muted-foreground pt-8">
            {t('matrix.empty')}
          </div>
        )}
      </div>
    </div>
  )
}

const QUADRANT_CONFIG: QuadrantConfig[] = [
  {
    id: 'urgentImportant',
    priorities: ['urgent', 'high'],
    dropPriority: 'high',
    border: 'border-red-500/60',
    background: 'bg-red-500/5',
    titleKey: 'matrix.q1.title',
    subtitleKey: 'matrix.q1.subtitle',
    priorityLabelKey: 'matrix.priorities.high',
  },
  {
    id: 'notUrgentImportant',
    priorities: ['low'],
    dropPriority: 'low',
    border: 'border-blue-500/50',
    background: 'bg-blue-500/5',
    titleKey: 'matrix.q2.title',
    subtitleKey: 'matrix.q2.subtitle',
    priorityLabelKey: 'matrix.priorities.low',
  },
  {
    id: 'urgentNotImportant',
    priorities: ['medium'],
    dropPriority: 'medium',
    border: 'border-yellow-500/60',
    background: 'bg-yellow-500/5',
    titleKey: 'matrix.q3.title',
    subtitleKey: 'matrix.q3.subtitle',
    priorityLabelKey: 'matrix.priorities.medium',
  },
  {
    id: 'notUrgentNotImportant',
    priorities: ['none'],
    dropPriority: 'none',
    border: 'border-gray-500/50 dark:border-gray-400/40',
    background: 'bg-gray-500/5',
    titleKey: 'matrix.q4.title',
    subtitleKey: 'matrix.q4.subtitle',
    priorityLabelKey: 'matrix.priorities.none',
  },
]

const MatrixView: React.FC = () => {
  const { state } = useTaskManager()
  const { updateTask } = useTaskActions()
  const { t } = useI18n()
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverQuadrantId, setDragOverQuadrantId] = useState<string | null>(null)

  const tasks = state.tasks.filter(task => !task.completed)

  const tasksByQuadrant = useMemo(() => {
    const map: Record<string, Task[]> = {}
    QUADRANT_CONFIG.forEach(config => {
      map[config.id] = []
    })

    tasks.forEach(task => {
      const quadrant = QUADRANT_CONFIG.find(config =>
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

    const task = state.tasks.find(item => item.id === taskId)
    if (!task || task.priority === dropPriority) {
      handleTaskDragEnd()
      return
    }

    void updateTask({ ...task, priority: dropPriority }, { silent: true })
    handleTaskDragEnd()
  }

  return (
    <AppPage>
      <AppPageContainer>
        <header className="py-6 border-b border-border shrink-0 hidden md:block space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">{t('matrix.title')}</h1>
          <p className="text-muted-foreground">{t('matrix.subtitle')}</p>
          <p className="text-sm text-muted-foreground">{t('matrix.description')}</p>
          <p className="text-xs text-muted-foreground/80">{t('matrix.dragHint')}</p>
        </header>
      </AppPageContainer>
      <AppPageMain className="h-full py-4 md:py-6 md:max-w-none">
        <div className="h-full flex items-stretch">
          <div className="w-full h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4 h-full">
              {QUADRANT_CONFIG.map(config => (
                <Quadrant
                  key={config.id}
                  config={config}
                  tasks={tasksByQuadrant[config.id] || []}
                  isDragOver={dragOverQuadrantId === config.id}
                  onDragOver={e => handleQuadrantDragOver(e, config.id)}
                  onDragLeave={() => setDragOverQuadrantId(prev => (prev === config.id ? null : prev))}
                  onDrop={e => handleQuadrantDrop(e, config.dropPriority)}
                  onTaskDragStart={handleTaskDragStart}
                  onTaskDragEnd={handleTaskDragEnd}
                />
              ))}
            </div>
          </div>
        </div>
      </AppPageMain>
    </AppPage>
  )
}

export default MatrixView
