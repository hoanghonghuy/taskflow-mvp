'use client'

import React, { useMemo } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import TaskItem from '@/features/tasks/components/TaskItem'
import type { Task, Priority } from '@/types'
import { AppPage, AppPageContainer, AppPageMain } from '@/components/layout/app-page'

interface QuadrantProps {
  title: string
  subtitle: string
  tasks: Task[]
  borderClass: string
  backgroundClass: string
}

const Quadrant: React.FC<QuadrantProps> = ({
  title,
  subtitle,
  tasks,
  borderClass,
  backgroundClass,
}) => {
  const { t } = useI18n()

  return (
    <div
      className={`
        p-4 rounded-xl flex flex-col border
        ${borderClass} ${backgroundClass}
      `}
    >
      <div className="mb-4">
        <h3 className="font-bold">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <TaskItem key={task.id} task={task} isDraggable={false} />
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

const QUADRANT_CONFIG = [
  {
    id: 'urgentImportant',
    priorities: ['urgent', 'high'] as Priority[],
    border: 'border-red-500/60',
    background: 'bg-red-500/5',
    titleKey: 'matrix.q1.title',
    subtitleKey: 'matrix.q1.subtitle',
  },
  {
    id: 'notUrgentImportant',
    priorities: ['low'] as Priority[],
    border: 'border-blue-500/50',
    background: 'bg-blue-500/5',
    titleKey: 'matrix.q2.title',
    subtitleKey: 'matrix.q2.subtitle',
  },
  {
    id: 'urgentNotImportant',
    priorities: ['medium'] as Priority[],
    border: 'border-yellow-500/60',
    background: 'bg-yellow-500/5',
    titleKey: 'matrix.q3.title',
    subtitleKey: 'matrix.q3.subtitle',
  },
  {
    id: 'notUrgentNotImportant',
    priorities: ['none'] as Priority[],
    border: 'border-gray-500/50 dark:border-gray-400/40',
    background: 'bg-gray-500/5',
    titleKey: 'matrix.q4.title',
    subtitleKey: 'matrix.q4.subtitle',
  },
] as const

const MatrixView: React.FC = () => {
  const { state } = useTaskManager()
  const { t } = useI18n()
  const tasks = state.tasks.filter(t => !t.completed)

  const tasksByQuadrant = useMemo(() => {
    const map: Record<string, Task[]> = {}
    QUADRANT_CONFIG.forEach(config => {
      map[config.id] = []
    })

    tasks.forEach(task => {
      const quadrant = QUADRANT_CONFIG.find(config =>
        config.priorities.includes((task.priority || 'none') as Priority)
      )
      const targetId = quadrant?.id ?? 'notUrgentNotImportant'
      map[targetId].push(task)
    })

    return map
  }, [tasks])

  return (
    <AppPage>
      <AppPageContainer>
        <header className="py-6 border-b border-border shrink-0 hidden md:block">
          <h1 className="text-2xl md:text-3xl font-bold">{t('matrix.title')}</h1>
          <p className="text-muted-foreground">{t('matrix.subtitle')}</p>
        </header>
      </AppPageContainer>
      <AppPageMain className="h-full py-4 md:py-6 md:max-w-none">
        <div className="h-full flex items-stretch">
          <div className="w-full h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4 h-full">
              {QUADRANT_CONFIG.map(config => (
                <Quadrant
                  key={config.id}
                  title={t(config.titleKey)}
                  subtitle={t(config.subtitleKey)}
                  tasks={tasksByQuadrant[config.id] || []}
                  borderClass={config.border}
                  backgroundClass={config.background}
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

