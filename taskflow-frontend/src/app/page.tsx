import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            TaskFlow
          </h1>
          <p className="text-2xl text-muted-foreground max-w-2xl mx-auto">
            Organize your life, one task at a time
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            The all-in-one productivity app with task management, habits tracking, 
            Pomodoro timer, and smart AI features to boost your productivity.
          </p>

          <div className="flex gap-4 justify-center items-center pt-8">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/login">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">Smart Task Management</h3>
            <p className="text-muted-foreground">
              Organize tasks with multiple views: List, Board, Calendar, and Eisenhower Matrix
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="text-4xl mb-4">🔥</div>
            <h3 className="text-xl font-semibold mb-2">Habit Tracking</h3>
            <p className="text-muted-foreground">
              Build lasting habits with visual tracking and streaks
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="text-4xl mb-4">⏱️</div>
            <h3 className="text-xl font-semibold mb-2">Focus Timer</h3>
            <p className="text-muted-foreground">
              Stay focused with built-in Pomodoro timer and session tracking
            </p>
          </div>
        </div>
      </div>

      <footer className="border-t mt-24 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 TaskFlow. Made with ❤️ for productivity enthusiasts.</p>
        </div>
      </footer>
    </div>
  )
}
