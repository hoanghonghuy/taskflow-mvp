'use client'

import { useUser } from '@/components/providers/user-provider'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import { useI18n } from '@/lib/hooks/use-i18n'

export default function DashboardPage() {
  const { user } = useUser()
  const { state } = useTaskManager()
  const { t } = useI18n()

  const completedTasks = state.tasks.filter(t => t.completed).length
  const activeTasks = state.tasks.length - completedTasks
  const completionRate = state.tasks.length > 0 
    ? Math.round((completedTasks / state.tasks.length) * 100) 
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">{t('nav.dashboard')}</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.name}! 👋
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Total Tasks</h3>
          <p className="text-3xl font-bold mt-2">{state.tasks.length}</p>
        </div>

        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Active</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">{activeTasks}</p>
        </div>

        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">{completedTasks}</p>
        </div>

        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Completion Rate</h3>
          <p className="text-3xl font-bold mt-2 text-purple-600">{completionRate}%</p>
        </div>
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Recent Tasks</h2>
          <p className="text-muted-foreground text-sm">Task list will be implemented soon...</p>
        </div>

        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Habits Progress</h2>
          <p className="text-muted-foreground text-sm">Habits tracker will be implemented soon...</p>
        </div>
      </div>
    </div>
  )
}
