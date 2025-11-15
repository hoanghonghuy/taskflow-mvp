'use client'

import React, { useState, useEffect } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useGemini } from '@/lib/hooks/use-gemini'
import { useToast } from '@/components/providers/toast-provider'
import type { Task, Priority } from '@/types'
import { CloseIcon, SparklesIcon, PRIORITY_MAP, FlagIcon, CalendarDayIcon, ListBulletIcon, ViewColumnsIcon } from '@/lib/constants'
import { Skeleton } from '@/components/ui/skeleton'

interface TaskFormProps {
  onClose: () => void
  defaultValues?: {
    listId?: string
    columnId?: string
  }
}

const TaskForm: React.FC<TaskFormProps> = ({ onClose, defaultValues }) => {
  const { state, dispatch } = useTaskManager()
  const { t } = useI18n()
  const { isAvailable: isGeminiAvailable } = useGemini()
  const addToast = useToast()

  const getInitialListId = () => {
    const initial = defaultValues?.listId || state.activeListId
    // Special lists other than inbox are not selectable in the form. Default to inbox.
    if (initial === 'today' || initial === 'upcoming') {
      return 'inbox'
    }
    // Ensure the list exists, otherwise default to inbox
    const listExists = state.lists.some(l => l.id === initial)
    if (initial !== 'inbox' && !listExists) {
      return 'inbox'
    }
    return initial
  }

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>('none')
  const [listId, setListId] = useState(getInitialListId())
  const [columnId, setColumnId] = useState<string | undefined>(defaultValues?.columnId)
  const [textToAnalyze, setTextToAnalyze] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  useEffect(() => {
    // Ensure columnId is valid for the selected listId, or clear it
    const columnsForList = state.columns.filter(c => c.listId === listId)
    if (columnId && !columnsForList.some(c => c.id === columnId)) {
      setColumnId(columnsForList[0]?.id)
    } else if (!columnId && columnsForList.length > 0) {
      setColumnId(columnsForList[0]?.id)
    }
  }, [listId, columnId, state.columns])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim() || undefined,
        completed: false,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        priority,
        listId: listId || 'inbox',
        columnId: columnId,
        tags: [],
        subtasks: [],
        createdAt: new Date().toISOString(),
        totalFocusTime: 0,
        comments: [],
      }
      dispatch({ type: 'ADD_TASK', payload: newTask })
      addToast.success(t('taskForm.createTask'))
      onClose()
    }
  }
  
  const handleAnalyzeText = async () => {
    if (!textToAnalyze.trim()) return
    setIsAnalyzing(true)
    try {
      // TODO: Implement Gemini text analysis when API is ready
      // For now, just extract basic info from text
      const text = textToAnalyze.trim()
      
      // Simple extraction (can be enhanced with Gemini later)
      const titleMatch = text.match(/^(.*?)(?:\.|$)/)
      if (titleMatch) {
        setTitle(titleMatch[1].trim())
      }
      
      // Look for date patterns
      const datePatterns = [
        /(?:tomorrow|ngày mai)/i,
        /(?:today|hôm nay)/i,
        /(?:next week|tuần sau)/i,
      ]
      
      const hasDate = datePatterns.some(pattern => pattern.test(text))
      if (hasDate) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setDueDate(tomorrow.toISOString().split('T')[0])
      }
      
      setTextToAnalyze('')
      addToast.success(t('taskForm.analyzeAndFill'))
    } catch (error: any) {
      addToast.error(error.message || t('briefing.error.failed'))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const columnsForList = state.columns.filter(c => c.listId === listId)

  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <header className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('taskForm.newTask')}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
            <CloseIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>
        
        <div className="p-6 overflow-y-auto">
          {isGeminiAvailable && (
            <div className="mb-6 p-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="h-5 w-5 text-primary" />
                <label className="text-sm font-semibold text-foreground">
                  {t('taskForm.createWithGemini')}
                </label>
              </div>
              <textarea
                value={textToAnalyze}
                onChange={e => setTextToAnalyze(e.target.value)}
                placeholder={t('taskForm.geminiPlaceholder')}
                rows={3}
                className="w-full p-3 bg-background/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
              />
              <button 
                onClick={handleAnalyzeText} 
                disabled={isAnalyzing || !textToAnalyze.trim()} 
                className="mt-3 w-full text-sm flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
              >
                {isAnalyzing ? (
                  <Skeleton className="h-4 w-4 rounded" />
                ) : (
                  <SparklesIcon className="h-4 w-4" />
                )}
                {t('taskForm.analyzeAndFill')}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="text-primary">*</span>
                {t('taskForm.titleLabel')}
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t('taskForm.titlePlaceholder')}
                className="w-full p-3 bg-secondary/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {t('taskForm.descriptionLabel')}
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder={t('taskForm.descriptionPlaceholder')}
                className="w-full p-3 bg-secondary/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors resize-none"
              />
            </div>
            
            <div className="border-t border-border pt-4"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CalendarDayIcon className="h-4 w-4 text-muted-foreground" />
                  {t('taskForm.dueDateLabel')}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full p-3 bg-secondary/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FlagIcon className="h-4 w-4 text-muted-foreground" />
                  {t('taskForm.priorityLabel')}
                </label>
                <select 
                  value={priority} 
                  onChange={e => setPriority(e.target.value as Priority)} 
                  className="w-full p-3 bg-secondary/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                >
                  {Object.entries(PRIORITY_MAP).map(([p, { label }]) => (
                    <option key={p} value={p}>{t(label as any) || p}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="border-t border-border pt-4"></div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ListBulletIcon className="h-4 w-4 text-muted-foreground" />
                {t('taskForm.listLabel')}
              </label>
              <select 
                value={listId} 
                onChange={e => setListId(e.target.value)} 
                className="w-full p-3 bg-secondary/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="inbox">{t('specialLists.inbox')}</option>
                {state.lists.map(list => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
            </div>
            
            {columnsForList.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ViewColumnsIcon className="h-4 w-4 text-muted-foreground" />
                  {t('board.columnName')}
                </label>
                <select 
                  value={columnId || ''} 
                  onChange={e => setColumnId(e.target.value || undefined)} 
                  className="w-full p-3 bg-secondary/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                >
                  {columnsForList.map(column => (
                    <option key={column.id} value={column.id}>{column.name}</option>
                  ))}
                </select>
              </div>
            )}
          </form>
        </div>

        <footer className="p-4 border-t border-border flex flex-col sm:flex-row justify-end gap-3 bg-secondary/30">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-md text-sm font-semibold hover:bg-secondary/80 transition-colors order-2 sm:order-1"
          >
            {t('common.cancel')}
          </button>
          <button 
            onClick={handleSubmit} 
            type="submit" 
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md order-1 sm:order-2"
          >
            {t('taskForm.createTask')}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default TaskForm

