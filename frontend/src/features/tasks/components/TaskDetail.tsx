"use client"

import React, { useState, useMemo } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useTaskActions } from '@/lib/hooks/use-task-manager'
import { useConfirmation } from '@/lib/hooks/use-confirmation'
import type { Task, Subtask, Priority, Comment } from '@/types'
import type { TranslationKey } from '@/lib/i18n/types'
import { 
  CheckIcon, 
  GlobeAltIcon,
  CloseIcon,
  CalendarDayIcon,
  StopwatchIcon,
  SparklesIcon,
  GripVerticalIcon,
  PlayCircleIcon
} from '@/lib/icons'
import { PRIORITY_MAP } from '@/lib/task-constants'
import { useGemini } from '@/lib/hooks/use-gemini'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { useUser } from '@/components/providers/user-provider'

interface TaskDetailProps {
  taskId: string
}

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId }) => {
  const { state, dispatch } = useTaskManager()
  const { t } = useI18n()
  const router = useRouter()
  const { allUsers, user: currentUser } = useUser()
  const { deleteTask, syncSubtasks, syncComments, updateTask: updateTaskApi, toggleTask } = useTaskActions()
  const { confirm } = useConfirmation()
  const { isAvailable: isGeminiAvailable } = useGemini()
  const task = useMemo<Task | null>(() => {
    return state.tasks.find(t => t.id === taskId) ?? null
  }, [state.tasks, taskId])
  const [newSubtask, setNewSubtask] = useState('')
  const [newTag, setNewTag] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedTagIndex, setDraggedTagIndex] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  if (!task) {
    return null
  }

  const completedSubtasks = task.subtasks.filter(st => st.completed).length
  const parentList = state.lists.find(list => list.id === task.listId) ?? null
  const reminderLabels: Record<number, TranslationKey> = {
    5: 'reminder.5min',
    15: 'reminder.15min',
    30: 'reminder.30min',
    60: 'reminder.1hour',
  }
  const reminderDisplay = task.reminderMinutes
    ? t(reminderLabels[task.reminderMinutes] ?? 'taskDetail.noReminder')
    : t('taskDetail.noReminder')
  const dueDateDisplay = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
    : t('common.noResults')
  const createdAtDisplay = task.createdAt
    ? new Date(task.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
    : null
  const progressPercent = task.subtasks.length > 0 ? (completedSubtasks / task.subtasks.length) * 100 : 0

  const formatFocusTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    let result = ''
    if (hours > 0) result += `${hours}h `
    if (minutes > 0) result += `${minutes}m`
    return result.trim()
  }

  const handleClose = () => {
    dispatch({ type: 'SET_SELECTED_TASK', payload: null })
  }

  const applyTaskUpdates = (updates: Partial<Task>) => {
    const updatedTask = { ...task, ...updates }
    void updateTaskApi(updatedTask)
  }

  const handleStartFocus = () => {
    dispatch({ type: 'SET_FOCUSED_TASK', payload: task.id })
    dispatch({ type: 'START_TIMER' })
    router.push('/pomodoro')
    handleClose()
  }

  const handleSubtaskChange = (subtaskId: string, completed: boolean) => {
    const newSubtasks = task.subtasks.map(st => st.id === subtaskId ? { ...st, completed } : st)
    void syncSubtasks(task.id, newSubtasks)
  }

  const handleDeleteSubtask = (subtaskId: string) => {
    const newSubtasks = task.subtasks.filter(st => st.id !== subtaskId)
    void syncSubtasks(task.id, newSubtasks)
  }

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSubtask.trim()) {
      const subtask: Subtask = { id: Date.now().toString(), title: newSubtask.trim(), completed: false }
      const newSubtasks = [...task.subtasks, subtask]
      void syncSubtasks(task.id, newSubtasks)
      setNewSubtask('')
    }
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault()
      const trimmedTag = newTag.trim().toLowerCase()
      if (trimmedTag && !task.tags.includes(trimmedTag)) {
        applyTaskUpdates({ tags: [...task.tags, trimmedTag] })
      }
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    applyTaskUpdates({ tags: task.tags.filter(tag => tag !== tagToRemove) })
  }

  // Drag and Drop handlers for tags
  const handleTagDragStart = (e: React.DragEvent<HTMLSpanElement>, index: number) => {
    setDraggedTagIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleTagDragOver = (e: React.DragEvent<HTMLSpanElement>) => e.preventDefault()
  const handleTagDrop = (e: React.DragEvent<HTMLSpanElement>, dropIndex: number) => {
    e.preventDefault()
    if (draggedTagIndex === null || draggedTagIndex === dropIndex) {
      setDraggedTagIndex(null)
      return
    }
    const newTags = [...task.tags]
    const [draggedItem] = newTags.splice(draggedTagIndex, 1)
    newTags.splice(dropIndex, 0, draggedItem)
    applyTaskUpdates({ tags: newTags })
    setDraggedTagIndex(null)
  }
  const handleTagDragEnd = () => setDraggedTagIndex(null)

  const handleGenerateSubtasks = async () => {
    // TODO: Implement Gemini subtask generation
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
    }, 1000)
  }

  const handleAssignTask = (userId: string | null) => {
    applyTaskUpdates({ assigneeId: userId })
  }

  const handleDeleteTask = async () => {
    const ok = await confirm({
      title: t('taskDetail.deleteConfirm.title' as TranslationKey, { title: task.title }),
      description: t('taskDetail.deleteConfirm.description' as TranslationKey, { title: task.title }),
      confirmText: t('taskDetail.deleteConfirm.confirm' as TranslationKey),
      variant: 'destructive',
    })

    if (!ok) return
    deleteTask(task.id)
  }

  const handleAddComment = (content: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: currentUser?.id ?? 'anonymous',
      content,
      timestamp: new Date().toISOString(),
    }
    const newComments = [...task.comments, newComment]
    void syncComments(task.id, newComments)
  }

  // Drag and Drop handlers for subtasks
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault()
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }
    const newSubtasks = [...task.subtasks]
    const [draggedItem] = newSubtasks.splice(draggedIndex, 1)
    newSubtasks.splice(dropIndex, 0, draggedItem)
    void syncSubtasks(task.id, newSubtasks)
    setDraggedIndex(null)
  }
  const handleDragEnd = () => setDraggedIndex(null)

  const priorityClasses = PRIORITY_MAP[task.priority]
  return (
    <div className="h-full w-full md:max-w-xl bg-card border-l border-border shadow-2xl flex flex-col md:animate-slide-in overflow-hidden">
      <header className="p-4 border-b border-border flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => void toggleTask(task.id)}
            aria-label={task.completed ? t('taskItem.aria.markIncomplete') : t('taskItem.aria.markComplete')}
            className={`h-5 w-5 rounded flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${task.completed ? 'bg-primary border-2 border-primary' : `bg-transparent border-2 ${priorityClasses.checkboxBorderColor}`}`}
          >
            {task.completed && <CheckIcon className="h-3.5 w-3.5 text-primary-foreground" />}
          </button>
          <div>
            <button
              onClick={() => void toggleTask(task.id)}
              className="text-sm font-medium text-left"
            >
              {task.completed ? t('taskDetail.completed') : t('taskDetail.markComplete')}
            </button>
            {parentList && (
              <p className="text-xs text-muted-foreground">
                {t('task.list')}: {parentList.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDeleteTask}
            className="text-xs text-destructive hover:underline"
          >
            {t('task.delete')}
          </button>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-secondary transition-colors" aria-label={t('common.close')}>
            <CloseIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="grow px-6 py-5 overflow-y-auto space-y-6">
        <section className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <input
              type="text"
              value={task.title}
              onChange={(e) => applyTaskUpdates({ title: e.target.value })}
              className="text-2xl md:text-3xl font-semibold bg-transparent w-full focus:outline-none"
            />
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${priorityClasses.checkboxBorderColor.replace('border-', 'border')} ${priorityClasses.color}`}>
              {t(priorityClasses.label)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {createdAtDisplay && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1">
                <span className="font-medium">{t('taskDetail.addButton')}</span>
                <span>{createdAtDisplay}</span>
              </span>
            )}
            {task.dueDate && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1">
                <CalendarDayIcon className="h-3.5 w-3.5" />
                <span>{dueDateDisplay}</span>
              </span>
            )}
            {task.totalFocusTime && task.totalFocusTime > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1">
                <StopwatchIcon className="h-3.5 w-3.5" />
                <span>{formatFocusTime(task.totalFocusTime)}</span>
              </span>
            )}
            {task.subtasks.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1">
                <GripVerticalIcon className="h-3.5 w-3.5" />
                <span>{completedSubtasks} / {task.subtasks.length} {t('taskDetail.subtasksLabel')}</span>
              </span>
            )}
            {task.reminderMinutes && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1">
                <GlobeAltIcon className="h-3.5 w-3.5" />
                <span>{reminderDisplay}</span>
              </span>
            )}
          </div>
        </section>

        <div className="space-y-4">
          <div>
            <label htmlFor="task-description" className="text-sm font-medium text-muted-foreground">
              {t('taskDetail.descriptionLabel')}
            </label>
            <textarea
              id="task-description"
              value={task.description || ''}
              onChange={(e) => applyTaskUpdates({ description: e.target.value })}
              rows={4}
              placeholder={t('taskDetail.descriptionPlaceholder')}
              className="mt-1 w-full p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 bg-secondary/30 border border-border rounded-xl p-4">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('taskDetail.assigneeLabel')}
              </span>
              <div className="flex items-center gap-3">
                <select
                  value={task.assigneeId || ''}
                  onChange={(e) => handleAssignTask(e.target.value || null)}
                  className="w-full p-2 bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">{t('taskDetail.unassigned')}</option>
                  {allUsers?.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  )) || []}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('taskDetail.priorityLabel')}
              </span>
              <select
                id="task-priority"
                value={task.priority}
                onChange={(e) => applyTaskUpdates({ priority: e.target.value as Priority })}
                className="w-full p-2 bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('taskDetail.dueDateLabel')}
              </span>
              <input
                type="date"
                value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => applyTaskUpdates({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="w-full p-2 bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('taskDetail.reminderLabel')}
              </span>
              <select
                value={task.reminderMinutes || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : undefined
                  applyTaskUpdates({ reminderMinutes: value })
                }}
                className="w-full p-2 bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">{t('taskDetail.noReminder')}</option>
                <option value="5">5 {t('taskDetail.minutes')}</option>
                <option value="15">15 {t('taskDetail.minutes')}</option>
                <option value="30">30 {t('taskDetail.minutes')}</option>
                <option value="60">1 {t('taskDetail.hour')}</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="tag-input" className="text-sm font-medium text-muted-foreground">
              {t('taskDetail.tagsLabel')}
            </label>
            <div className="mt-2 flex flex-wrap gap-2 items-center p-2 bg-secondary/50 rounded-md">
              {task.tags.map((tag, index) => (
                <span 
                  key={tag}
                  draggable
                  onDragStart={(e) => handleTagDragStart(e, index)}
                  onDragOver={handleTagDragOver}
                  onDrop={(e) => handleTagDrop(e, index)}
                  onDragEnd={handleTagDragEnd}
                  className={`flex items-center gap-1 bg-secondary px-2 py-1 rounded-full text-xs font-medium cursor-move transition-opacity ${draggedTagIndex === index ? 'opacity-50' : 'opacity-100'}`}
                >
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="rounded-full hover:bg-muted-foreground/20 z-10">
                    <CloseIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                id="tag-input"
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={t('taskDetail.tagsPlaceholder')}
                className="grow bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t('taskDetail.subtasksLabel')}
              </h3>
              {isGeminiAvailable && (
                <button 
                  onClick={handleGenerateSubtasks} 
                  disabled={isGenerating} 
                  className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 disabled:opacity-50"
                >
                  {isGenerating ? '...' : <SparklesIcon className="h-4 w-4" />}
                  {t('taskDetail.generateButton')}
                </button>
              )}
            </div>
            {task.subtasks.length > 0 && (
              <div className="my-3 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('taskDetail.progressLabel')}</span>
                  <span>{completedSubtasks} / {task.subtasks.length}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
            <div className="mt-2 space-y-2">
              {task.subtasks.map((st, index) => (
                <div 
                  key={st.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 p-2 bg-secondary/50 rounded-md transition-opacity group ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
                >
                  <GripVerticalIcon className="h-5 w-5 text-muted-foreground/50 cursor-move group-hover:text-muted-foreground" />
                  <button
                    onClick={() => handleSubtaskChange(st.id, !st.completed)}
                    aria-label={st.completed ? t('taskItem.aria.markIncomplete') : t('taskItem.aria.markComplete')}
                    className={`
                      h-4 w-4 rounded-sm shrink-0
                      flex items-center justify-center 
                      transition-all duration-150
                      focus:outline-none focus:ring-1 focus:ring-ring
                      ${st.completed 
                        ? 'bg-primary border border-primary' 
                        : 'bg-transparent border border-muted-foreground/50'
                      }
                    `}
                  >
                    {st.completed && <CheckIcon className="h-2.5 w-2.5 text-primary-foreground" />}
                  </button>
                  <input 
                    type="text" 
                    value={st.title} 
                    onChange={(e) => {
                      const newSubtasks = task.subtasks.map(sub =>
                        sub.id === st.id ? { ...sub, title: e.target.value } : sub
                      )
                      void syncSubtasks(task.id, newSubtasks)
                    }}
                    className={`grow bg-transparent text-sm ${st.completed ? 'line-through text-muted-foreground' : ''} focus:outline-none`} 
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(st.id)}
                    aria-label={t('taskDetail.aria.deleteSubtask' as TranslationKey)}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/10 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <CloseIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2 p-2">
                <input 
                  type="text" 
                  value={newSubtask} 
                  onChange={(e) => setNewSubtask(e.target.value)} 
                  placeholder={t('taskDetail.addSubtaskPlaceholder')} 
                  className="grow bg-transparent text-sm focus:outline-none" 
                />
                <button type="submit" className="text-primary text-sm font-semibold">
                  {t('taskDetail.addButton')}
                </button>
              </form>
            </div>
          </div>

          {task.comments && task.comments.length > 0 && (
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t('taskDetail.commentsLabel')}
              </h3>
              <div className="space-y-2">
                {task.comments.map((comment) => {
                  const commentUser = allUsers?.find(u => u.id === comment.userId) || null
                  return (
                    <div key={comment.id} className="flex gap-2 p-2 bg-secondary/50 rounded-md">
                      <Avatar user={commentUser || null} className="w-6 h-6" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{commentUser?.name || t('comments.unknownUser')}</p>
                        <p className="text-sm">{comment.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  const input = e.currentTarget.querySelector('input') as HTMLInputElement
                  if (input?.value.trim()) {
                    handleAddComment(input.value.trim())
                    input.value = ''
                  }
                }}
                className="mt-2 flex gap-2"
              >
                <input
                  type="text"
                  placeholder={t('taskDetail.addCommentPlaceholder')}
                  className="flex-1 p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
                  {t('taskDetail.addButton')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border flex gap-2 shrink-0">
        <button 
          onClick={handleStartFocus} 
          className="text-sm w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlayCircleIcon className="h-5 w-5" /> 
          {t('taskDetail.startFocusButton')}
        </button>
      </div>
    </div>
  )
}

export default TaskDetail

