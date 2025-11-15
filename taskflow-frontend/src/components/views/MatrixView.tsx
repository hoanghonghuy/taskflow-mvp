'use client'

import React, { useMemo } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import TaskItem from '@/components/task/TaskItem'
import type { Task, Priority } from '@/types'

interface QuadrantProps {
  title: string
  subtitle: string
  tasks: Task[]
  className?: string
}

const Quadrant: React.FC<QuadrantProps> = ({ title, subtitle, tasks, className }) => {
  const { t } = useI18n()

  return (
    <div className={`p-4 rounded-lg flex flex-col bg-card border border-border ${className}`}>
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
            {t('matrix.empty') || 'No tasks'}
          </div>
        )}
      </div>
    </div>
  )
}

const MatrixView: React.FC = () => {
  const { state } = useTaskManager()
  const { t } = useI18n()
  const tasks = state.tasks.filter(t => !t.completed)

  const categorizedTasks = useMemo(() => {
    const urgentImportant = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent')
    const notUrgentImportant = tasks.filter(t => t.priority === 'low')
    const urgentNotImportant = tasks.filter(t => t.priority === 'medium')
    const notUrgentNotImportant = tasks.filter(t => t.priority === 'none')
    return { urgentImportant, notUrgentImportant, urgentNotImportant, notUrgentNotImportant }
  }, [tasks])

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <header className="p-6 border-b border-border flex-shrink-0">
        <h1 className="text-3xl font-bold">{t('matrix.title') || 'Eisenhower Matrix'}</h1>
        <p className="text-muted-foreground">{t('matrix.subtitle') || 'Prioritize your tasks'}</p>
      </header>
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">
        <Quadrant
          title={t('matrix.q1.title') || 'Urgent & Important'}
          subtitle={t('matrix.q1.subtitle') || 'Do first'}
          tasks={categorizedTasks.urgentImportant}
          className="border-red-500/50"
        />
        <Quadrant
          title={t('matrix.q2.title') || 'Not Urgent & Important'}
          subtitle={t('matrix.q2.subtitle') || 'Schedule'}
          tasks={categorizedTasks.notUrgentImportant}
          className="border-blue-500/50"
        />
        <Quadrant
          title={t('matrix.q3.title') || 'Urgent & Not Important'}
          subtitle={t('matrix.q3.subtitle') || 'Delegate'}
          tasks={categorizedTasks.urgentNotImportant}
          className="border-yellow-500/50"
        />
        <Quadrant
          title={t('matrix.q4.title') || 'Not Urgent & Not Important'}
          subtitle={t('matrix.q4.subtitle') || 'Eliminate'}
          tasks={categorizedTasks.notUrgentNotImportant}
          className="border-gray-500/50"
        />
      </main>
    </div>
  )
}

export default MatrixView

