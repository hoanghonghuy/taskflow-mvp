'use client'

import React, { useState, useEffect } from 'react'
import { useGemini } from '@/lib/hooks/use-gemini'
import { useI18n } from '@/lib/i18n/hooks'
import { useToast } from '@/components/providers/toast-provider'
import { CloseIcon, SparklesIcon } from '@/lib/icons'
import Spinner from '@/components/ui/spinner'
import * as aiApi from '@/lib/api/ai'

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
  const { isAvailable } = useGemini()
  const { t, currentLanguage } = useI18n()
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
        const content = await aiApi.fetchBriefing(currentLanguage)
        setBriefing(content)
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
  }, [isAvailable, addToast, t, currentLanguage])

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

