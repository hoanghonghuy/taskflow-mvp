'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useTaskManager, useTaskActions } from '@/components/providers/task-manager-provider'
import { useUser } from '@/components/providers/user-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { useGemini } from '@/lib/hooks/use-gemini'
import { useAiFeature } from '@/lib/hooks/use-ai-feature'
import { AI_FEATURES_ENABLED } from '@/lib/feature-flags'
import { useToast } from '@/components/providers/toast-provider'
import type { Task, Priority } from '@/types'
import type { TranslationKey } from '@/lib/i18n/types'
import {
  CloseIcon,
  SparklesIcon,
  FlagIcon,
  CalendarDayIcon,
  ListBulletIcon,
  ViewColumnsIcon,
} from '@/lib/icons'
import { PRIORITY_MAP } from '@/lib/task-constants'
import { Skeleton } from '@/components/ui/skeleton'
import * as aiApi from '@/lib/api/ai'
import { isOwnedList } from '@/lib/utils/list-access'
import { dateOnlyInputToIso, toYYYYMMDD } from '@/lib/utils/date-helpers'

interface TaskFormProps {
  onClose: () => void
  defaultValues?: {
    listId?: string
    columnId?: string
  }
}

const TaskForm: React.FC<TaskFormProps> = ({ onClose, defaultValues }) => {
  const { state } = useTaskManager()
  const { user } = useUser()
  const { addTask } = useTaskActions()
  const { t, currentLanguage } = useI18n()
  const { isAvailable: isGeminiAvailable } = useGemini()
  const { runIfEnabled } = useAiFeature()
  const showAiAssist = AI_FEATURES_ENABLED && isGeminiAvailable
  const addToast = useToast()

  const ownedLists = useMemo(
    () => state.lists.filter((list) => isOwnedList(list, user?.id)),
    [state.lists, user?.id],
  )

  const resolveInboxListId = () => {
    const inbox = ownedLists.find((l) => l.name === 'Inbox' || l.id === 'inbox')
      ?? state.lists.find((l) => l.name === 'Inbox' || l.id === 'inbox')
    return inbox?.id ?? 'inbox'
  }

  const getInitialListId = () => {
    const inboxListId = resolveInboxListId()
    const initial = defaultValues?.listId || state.activeListId
    if (initial === 'today' || initial === 'upcoming' || initial === 'inbox') {
      return inboxListId
    }
    const listExists = ownedLists.some((l) => l.id === initial)
    if (!listExists) {
      return inboxListId
    }
    return initial
  }

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>('none')
  const [listId, setListId] = useState(getInitialListId())
  const [columnId, setColumnId] = useState<string | undefined>(defaultValues?.columnId)
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [reminderMinutes, setReminderMinutes] = useState<number | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const value = newTag.trim()
    if (!value || tags.includes(value)) return
    setTags((prev) => [...prev, value])
    setNewTag('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    const newTask: Omit<Task, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      completed: false,
      dueDate: dueDate ? dateOnlyInputToIso(dueDate) : undefined,
      priority,
      listId: listId || resolveInboxListId(),
      columnId: columnId,
      tags,
      subtasks: [],
      reminderMinutes: reminderMinutes === '' ? undefined : reminderMinutes,
      createdAt: new Date().toISOString(),
      totalFocusTime: 0,
      comments: [],
    }
    try {
      await addTask(newTask)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleAnalyzeText = async () => {
    if (!textToAnalyze.trim()) return
    runIfEnabled(() => void analyzeTextWithAi())
  }

  const analyzeTextWithAi = async () => {
    setIsAnalyzing(true)
    try {
      const text = textToAnalyze.trim()
      const data = await aiApi.analyzeTaskText(text, currentLanguage)

      if (data && typeof data.title === 'string' && data.title.trim()) {
        setTitle(data.title.trim())
      }

      if (data && data.dueDate) {
        const parsed = new Date(data.dueDate)
        if (!Number.isNaN(parsed.getTime())) {
          setDueDate(toYYYYMMDD(parsed))
        }
      }

      if (data && typeof data.priority === 'string') {
        const lower = data.priority.toLowerCase()
        if (lower === 'none' || lower === 'low' || lower === 'medium' || lower === 'high' || lower === 'urgent') {
          setPriority(lower as Priority)
        }
      }

      setTextToAnalyze('')
      addToast.success(t('taskForm.analyzeAndFill'))
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: string }).message === 'string'
          ? (error as { message: string }).message
          : t('briefing.error.failed')
      addToast.error(message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const columnsForList = state.columns.filter(c => c.listId === listId)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <header className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('taskForm.newTask')}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
            <CloseIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>
        
        <div className="p-6 overflow-y-auto">
          {showAiAssist && (
            <div className="mb-6 p-4 bg-linear-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
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
                  {(Object.keys(PRIORITY_MAP) as (keyof typeof PRIORITY_MAP)[]).map(priorityKey => {
                    const { label } = PRIORITY_MAP[priorityKey]
                    return (
                      <option key={priorityKey} value={priorityKey}>
                        {t(label)}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  {t('taskForm.tagsLabel')}
                </label>
                <div className="flex flex-wrap items-center gap-2 p-2 min-h-[44px] bg-secondary/50 border border-border rounded-md">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="rounded-full hover:bg-muted-foreground/20"
                        aria-label={t('taskForm.removeTagAria', { tag })}
                      >
                        <CloseIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={t('taskForm.tagsPlaceholder')}
                    className="grow min-w-[120px] bg-transparent text-sm focus:outline-none"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t('taskForm.tagsHelper')}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  {t('taskForm.reminderLabel')}
                </label>
                <select
                  value={reminderMinutes}
                  onChange={(e) => {
                    const raw = e.target.value
                    setReminderMinutes(raw === '' ? '' : parseInt(raw, 10))
                  }}
                  className="w-full p-3 bg-secondary/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                >
                  <option value="">{t('taskDetail.noReminder')}</option>
                  <option value="5">{t('reminder.5min')}</option>
                  <option value="15">{t('reminder.15min')}</option>
                  <option value="30">{t('reminder.30min')}</option>
                  <option value="60">{t('reminder.1hour')}</option>
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
                {ownedLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name === 'Inbox' || list.id === 'inbox'
                      ? t('specialLists.inbox')
                      : list.name}
                  </option>
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
            <footer className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row justify-end gap-3 bg-secondary/0">
              <button 
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-md text-sm font-semibold hover:bg-secondary/80 transition-colors order-2 sm:order-1"
              >
                {t('common.cancel')}
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md order-1 sm:order-2 disabled:opacity-60 disabled:pointer-events-none"
              >
                {t('taskForm.createTask')}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TaskForm

