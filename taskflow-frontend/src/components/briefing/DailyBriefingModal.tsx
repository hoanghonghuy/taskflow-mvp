'use client'

import React, { useState, useEffect } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useGemini } from '@/lib/hooks/use-gemini'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useToast } from '@/components/providers/toast-provider'
import { CloseIcon, SparklesIcon } from '@/lib/constants'
import Spinner from '@/components/ui/spinner'

interface DailyBriefingModalProps {
  onClose: () => void
}

// A simple markdown to HTML converter for the briefing
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const htmlContent = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\n/g, '<br />') // Newlines

  return (
    <div 
      className="prose prose-sm max-w-none text-foreground" 
      dangerouslySetInnerHTML={{ __html: htmlContent }} 
    />
  )
}

const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({ onClose }) => {
  const { state } = useTaskManager()
  const { isAvailable } = useGemini()
  const { t } = useI18n()
  const addToast = useToast()
  const [briefing, setBriefing] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBriefing = async () => {
      if (!isAvailable) {
        setError(t('briefing.error.unavailable') || 'Gemini API is not available.')
        setIsLoading(false)
        return
      }
      try {
        // TODO: Implement Gemini API call when backend is ready
        // For now, generate a mock briefing
        const today = new Date()
        const todayTasks = state.tasks.filter(task => {
          if (!task.dueDate) return false
          const dueDate = new Date(task.dueDate)
          return dueDate.toDateString() === today.toDateString()
        })
        const completedHabits = state.habits.filter(habit => {
          const todayStr = today.toISOString().split('T')[0]
          return habit.completions.includes(todayStr)
        })
        
        const mockBriefing = `**Good ${today.getHours() < 12 ? 'morning' : today.getHours() < 18 ? 'afternoon' : 'evening'}!**

Here's your daily briefing for ${today.toLocaleDateString()}:

**Tasks for Today:**
${todayTasks.length > 0 
  ? `You have ${todayTasks.length} task(s) due today:\n${todayTasks.map(t => `- ${t.title}`).join('\n')}`
  : 'No tasks due today. Great job staying on top of things!'
}

**Habits:**
${completedHabits.length > 0 
  ? `You've completed ${completedHabits.length} habit(s) today. Keep it up!`
  : 'Remember to check off your habits today!'
}

**Focus Time:**
You've completed ${state.pomodoro.sessionsCompleted} Pomodoro session(s) today. ${state.pomodoro.sessionsCompleted > 0 ? 'Excellent focus!' : 'Ready to start your first session?'}

**Recommendations:**
${todayTasks.length > 0 
  ? 'Focus on completing your due tasks first. Prioritize by urgency and importance.'
  : 'Take some time to plan ahead or work on important but not urgent tasks.'
}

Have a productive day! 🚀`

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        setBriefing(mockBriefing)
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred.')
        addToast.error(err.message || t('briefing.error.failed') || 'Failed to generate briefing')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBriefing()
  }, [state.tasks, state.habits, state.pomodoro.sessionsCompleted, isAvailable, addToast, t])

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-full max-h-[85vh]">
        <header className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold">
              {t('briefing.title') || 'Your AI Daily Briefing'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
            <CloseIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>

        <div className="flex-grow p-6 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Spinner className="h-8 w-8" />
              <p className="mt-4 text-muted-foreground">
                {t('briefing.loading') || 'Gemini is analyzing your day...'}
              </p>
            </div>
          )}
          {error && !isLoading && (
            <div className="text-center text-destructive">
              <h3 className="font-semibold">
                {t('briefing.error.failed') || 'Failed to generate briefing'}
              </h3>
              <p className="text-sm">{error}</p>
            </div>
          )}
          {briefing && !isLoading && (
            <MarkdownRenderer content={briefing} />
          )}
        </div>
        <footer className="p-4 border-t border-border flex justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90"
          >
            {t('briefing.button.gotIt') || 'Got it!'}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default DailyBriefingModal

