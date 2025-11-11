'use client'

import { useUser } from '@/components/providers/user-provider'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user, logout } = useUser()
  const { state } = useTaskManager()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="container mx-auto p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Total Tasks</h3>
            <p className="text-4xl font-bold text-primary">{state.tasks.length}</p>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Completed</h3>
            <p className="text-4xl font-bold text-green-600">
              {state.tasks.filter(t => t.completed).length}
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Active Habits</h3>
            <p className="text-4xl font-bold text-purple-600">{state.habits.length}</p>
          </div>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Welcome, {user?.name}! 👋</h2>
          <p className="text-muted-foreground">
            This is your dashboard. More features coming soon!
          </p>
        </div>
      </div>
    </div>
  )
}
