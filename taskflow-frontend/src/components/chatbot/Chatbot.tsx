'use client'

import React, { useState, useRef, useEffect } from 'react'
import { CloseIcon, PaperAirplaneIcon, CubeTransparentIcon, GlobeAltIcon, SparklesIcon } from '@/lib/constants'
import { useGemini } from '@/lib/hooks/use-gemini'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useToast } from '@/components/providers/toast-provider'
import type { ChatMessage, GroundingSource } from '@/types'
import Spinner from '@/components/ui/spinner'

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
  const { t } = useI18n()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])
  
  useEffect(() => {
    setMessages([{
      id: 'initial',
      role: 'model',
      text: t('chatbot.initialMessage') || 'Hello! I\'m your AI assistant. How can I help you today?',
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

    const currentInput = input
    setInput('')
    setIsLoading(true)
    setMessages(prev => [...prev, userMessage])
    
    const modelMessageId = (Date.now() + 1).toString()
    // Add a placeholder for the model's response
    setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '', timestamp: Date.now() }])

    try {
      // TODO: Implement Gemini API call when backend is ready
      // For now, generate a mock response
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockResponse = `I understand you're asking about "${currentInput}". This is a mock response. When the Gemini API is integrated, I'll be able to provide real AI-powered assistance with your tasks, habits, and productivity goals.`
      
      setMessages(prev => prev.map(m => 
        m.id === modelMessageId 
          ? { ...m, text: mockResponse } 
          : m
      ))

    } catch (error: any) {
      addToast.error(error.message || 'An error occurred.')
      setMessages(prev => prev.filter(m => m.id !== modelMessageId)) // Remove placeholder
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-[80vh]">
        <header className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CubeTransparentIcon className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold">
              {t('chatbot.title') || 'Chat with Gemini'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
            <CloseIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>

        <div className="flex-grow p-4 overflow-y-auto space-y-4">
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
                    {t('chatbot.sources') || 'Sources'}
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {msg.groundingSources.map(source => (
                      <li key={source.uri}>
                        <a 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:underline text-blue-500"
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
          <div className="flex items-center justify-start flex-wrap gap-x-4 gap-y-2 mb-2">
            <label htmlFor="thinking-mode" className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                id="thinking-mode"
                type="checkbox"
                checked={useThinkingMode}
                onChange={(e) => {
                  setUseThinkingMode(e.target.checked)
                  if (e.target.checked) setUseSearchGrounding(false)
                }}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
                disabled={!isAvailable}
              />
              <SparklesIcon className="h-4 w-4" /> 
              {t('chatbot.thinkingMode') || 'Thinking Mode'}
            </label>
            <label htmlFor="search-grounding" className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                id="search-grounding"
                type="checkbox"
                checked={useSearchGrounding}
                onChange={(e) => {
                  setUseSearchGrounding(e.target.checked)
                  if (e.target.checked) setUseThinkingMode(false)
                }}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
                disabled={!isAvailable}
              />
              <GlobeAltIcon className="h-4 w-4" /> 
              {t('chatbot.searchWeb') || 'Search Web'}
            </label>
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
              placeholder={t('chatbot.placeholder') || 'Type your message...'}
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
      </div>
    </div>
  )
}

export default Chatbot

