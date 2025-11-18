'use client'

import React, { useState, useEffect } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useGemini } from '@/lib/hooks/use-gemini'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useToast } from '@/components/providers/toast-provider'
import { CloseIcon, SparklesIcon } from '@/lib/icons'
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
        setError(t('briefing.error.unavailable'))
        setIsLoading(false)
        return
      }
      try {
        // TODO: Implement Gemini API call when backend is ready
        // For now, generate a mock briefing (i18n-based)
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

        const timeOfDayKey =
          today.getHours() < 12
            ? 'briefing.mock.timeOfDay.morning'
            : today.getHours() < 18
              ? 'briefing.mock.timeOfDay.afternoon'
              : 'briefing.mock.timeOfDay.evening'

        const timeOfDayLabel = t(timeOfDayKey)

        const sections: string[] = []

        sections.push(
          `**${t('briefing.mock.greeting', { timeOfDay: timeOfDayLabel })}**`,
          '',
          t('briefing.mock.intro', { date: today.toLocaleDateString() }),
          '',
          `**${t('briefing.mock.sectionTasksTitle')}**`
        )

        if (todayTasks.length > 0) {
          sections.push(
            t('briefing.mock.sectionTasksWithItems', { count: todayTasks.length.toString() }),
            ...todayTasks.map(task => `- ${task.title}`)
          )
        } else {
          sections.push(t('briefing.mock.sectionTasksNoItems'))
        }

        sections.push(
          '',
          `**${t('briefing.mock.sectionHabitsTitle')}**`
        )

        if (completedHabits.length > 0) {
          sections.push(
            t('briefing.mock.sectionHabitsWithItems', { count: completedHabits.length.toString() })
          )
        } else {
          sections.push(t('briefing.mock.sectionHabitsNoItems'))
        }

        sections.push(
          '',
          `**${t('briefing.mock.sectionFocusTitle')}**`,
          t('briefing.mock.sectionFocusBody', { count: state.pomodoro.sessionsCompleted.toString() }),
          state.pomodoro.sessionsCompleted > 0
            ? t('briefing.mock.sectionFocusPositive')
            : t('briefing.mock.sectionFocusZero'),
          '',
          `**${t('briefing.mock.sectionRecommendTitle')}**`,
          todayTasks.length > 0
            ? t('briefing.mock.recommendWithTasks')
            : t('briefing.mock.recommendNoTasks'),
          '',
          t('briefing.mock.outro')
        )

        const mockBriefing = sections.join('\n')

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        setBriefing(mockBriefing)
      } catch (err: unknown) {
        const message =
          typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: string }).message === 'string'
            ? (err as { message: string }).message
            : t('briefing.error.unknown')
        setError(message)
        addToast.error(message || t('briefing.error.failed'))
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
              {t('briefing.title')}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
            <CloseIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>

        <div className="grow p-6 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Spinner className="h-8 w-8" />
              <p className="mt-4 text-muted-foreground">
                {t('briefing.loading')}
              </p>
            </div>
          )}
          {error && !isLoading && (
            <div className="text-center text-destructive">
              <h3 className="font-semibold">
                {t('briefing.error.failed')}
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
            {t('briefing.button.gotIt')}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default DailyBriefingModal

