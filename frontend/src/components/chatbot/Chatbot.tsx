'use client'

import React, { useState, useRef, useEffect } from 'react'
import { CloseIcon, PaperAirplaneIcon, CubeTransparentIcon, GlobeAltIcon, SparklesIcon } from '@/lib/icons'
import { useGemini } from '@/lib/hooks/use-gemini'
import { useI18n } from '@/lib/i18n/hooks'
import { useToast } from '@/components/providers/toast-provider'
import type { ChatMessage } from '@/types'
import Spinner from '@/components/ui/spinner'
import { SwitchField } from '@/components/ui/switch'
import { AccessibleModalSurface } from '@/components/ui/accessible-modal-surface'
import * as aiApi from '@/lib/api/ai'

interface ChatbotProps {
  onClose: () => void
}

const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [useThinkingMode, setUseThinkingMode] = useState(false)
  const [useSearchGrounding, setUseSearchGrounding] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isAvailable } = useGemini()
  const addToast = useToast()
  const { t, currentLanguage } = useI18n()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])
  
  useEffect(() => {
    setMessages([{
      id: 'initial',
      role: 'model',
      text: t('chatbot.initialMessage'),
      timestamp: Date.now()
    }])
  }, [t])

  const handleSend = async () => {
    if (input.trim() === '' || isLoading || !isAvailable) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    }

    const conversationForBackend = [...messages, userMessage].map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      text: m.text,
    }))
    setInput('')
    setIsLoading(true)
    setMessages(prev => [...prev, userMessage])
    
    const modelMessageId = (Date.now() + 1).toString()
    // Add a placeholder for the model's response
    setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '', timestamp: Date.now() }])

    try {
      const reply = await aiApi.sendChatMessage({
        messages: conversationForBackend,
        language: currentLanguage,
        thinkingMode: useThinkingMode,
        searchGrounding: useSearchGrounding,
      })

      setMessages(prev => prev.map(m =>
        m.id === modelMessageId
          ? { ...m, text: reply }
          : m
      ))

    } catch (error: unknown) {
      const fallbackMessage = t('chatbot.error.generic')
      const message =
        typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: string }).message === 'string'
          ? (error as { message: string }).message
          : fallbackMessage
      addToast.error(message)
      setMessages(prev => prev.filter(m => m.id !== modelMessageId)) // Remove placeholder
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <AccessibleModalSurface
        aria-label={t('chatbot.title')}
        onClose={onClose}
        className="bg-card rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-[calc(100dvh-2rem)]"
      >
        <header className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CubeTransparentIcon className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold">
              {t('chatbot.title')}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
            <CloseIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>

        <div className="grow p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text || '...'}</p>
                </div>
              </div>
              {msg.groundingSources && msg.groundingSources.length > 0 && (
                <div className="max-w-md mt-2 text-xs text-muted-foreground">
                  <h4 className="font-semibold mb-1">
                    {t('chatbot.sources')}
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {msg.groundingSources.map(source => (
                      <li key={source.uri}>
                        <a 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:underline text-primary"
                        >
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length-1]?.role === 'model' && !messages[messages.length-1]?.text && (
            <div className="flex justify-start">
              <div className="max-w-md p-3 rounded-lg bg-secondary">
                <Spinner />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <footer className="p-4 border-t border-border">
          <div className="grid gap-3 sm:grid-cols-2 mb-3">
            <SwitchField
              id="thinking-mode"
              size="sm"
              className="rounded-lg border border-border bg-secondary/30 px-3 py-2"
              label={
                <span className="inline-flex items-center gap-2 text-xs">
                  <SparklesIcon className="h-4 w-4" />
                  {t('chatbot.thinkingMode')}
                </span>
              }
              checked={useThinkingMode}
              onCheckedChange={(checked) => {
                setUseThinkingMode(checked)
                if (checked) setUseSearchGrounding(false)
              }}
              disabled={!isAvailable}
              disabledReason={!isAvailable ? t('chatbot.aiUnavailable') : undefined}
            />
            <SwitchField
              id="search-grounding"
              size="sm"
              className="rounded-lg border border-border bg-secondary/30 px-3 py-2"
              label={
                <span className="inline-flex items-center gap-2 text-xs">
                  <GlobeAltIcon className="h-4 w-4" />
                  {t('chatbot.searchWeb')}
                </span>
              }
              checked={useSearchGrounding}
              onCheckedChange={(checked) => {
                setUseSearchGrounding(checked)
                if (checked) setUseThinkingMode(false)
              }}
              disabled={!isAvailable}
              disabledReason={!isAvailable ? t('chatbot.aiUnavailable') : undefined}
            />
          </div>
          <div className="relative">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={t('chatbot.placeholder')}
              className="w-full p-3 pr-12 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              rows={1}
              style={{ height: 'auto', maxHeight: '100px' }}
              disabled={!isAvailable}
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !isAvailable || !input.trim()} 
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed"
            >
              {isLoading ? <Spinner size="sm" /> : <PaperAirplaneIcon className="h-5 w-5" />}
            </button>
          </div>
        </footer>
      </AccessibleModalSurface>
    </div>
  )
}

export default Chatbot

