'use client'

import React, { useState, useEffect } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import type { Task, Subtask, Priority, Comment } from '@/types'
import { PRIORITY_MAP, CloseIcon, GripVerticalIcon, PlayCircleIcon, StopwatchIcon, RepeatIcon, CheckIcon, SparklesIcon } from '@/lib/constants'
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
  const { allUsers } = useUser()
  const { isAvailable: isGeminiAvailable } = useGemini()
  const [task, setTask] = useState<Task | null>(null)
  const [newSubtask, setNewSubtask] = useState('')
  const [newTag, setNewTag] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedTagIndex, setDraggedTagIndex] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const foundTask = state.tasks.find(t => t.id === taskId)
    setTask(foundTask || null)
  }, [taskId, state.tasks])

  if (!task) {
    return null
  }

  const completedSubtasks = task.subtasks.filter(st => st.completed).length

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

  const updateTask = (updates: Partial<Task>) => {
    if (!task) return
    const updatedTask = { ...task, ...updates }
    setTask(updatedTask)
    dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
  }

  const handleStartFocus = () => {
    dispatch({ type: 'SET_FOCUSED_TASK', payload: task.id })
    dispatch({ type: 'START_TIMER' })
    router.push('/pomodoro')
    handleClose()
  }

  const handleSubtaskChange = (subtaskId: string, completed: boolean) => {
    const newSubtasks = task.subtasks.map(st => st.id === subtaskId ? { ...st, completed } : st)
    updateTask({ subtasks: newSubtasks })
  }

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSubtask.trim()) {
      const subtask: Subtask = { id: Date.now().toString(), title: newSubtask.trim(), completed: false }
      updateTask({ subtasks: [...task.subtasks, subtask] })
      setNewSubtask('')
    }
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault()
      const trimmedTag = newTag.trim().toLowerCase()
      if (trimmedTag && !task.tags.includes(trimmedTag)) {
        updateTask({ tags: [...task.tags, trimmedTag] })
      }
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    updateTask({ tags: task.tags.filter(tag => tag !== tagToRemove) })
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
    updateTask({ tags: newTags })
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
    dispatch({ type: 'ASSIGN_TASK', payload: { taskId: task.id, userId } })
  }

  const handleAddComment = (content: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: 'user-001',
      content,
      timestamp: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_COMMENT', payload: { taskId: task.id, comment: newComment } })
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
    updateTask({ subtasks: newSubtasks })
    setDraggedIndex(null)
  }
  const handleDragEnd = () => setDraggedIndex(null)

  const priorityClasses = PRIORITY_MAP[task.priority]
  const assignee = allUsers?.find(u => u.id === task.assigneeId) || null

  return (
    <div className="h-full w-full md:w-96 bg-card border-l border-border shadow-2xl flex flex-col md:animate-slide-in overflow-hidden">
      <header className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: { taskId: task.id } })}
            aria-label={task.completed ? t('taskItem.aria.markIncomplete') : t('taskItem.aria.markComplete')}
            className={`
              h-5 w-5 rounded flex-shrink-0
              flex items-center justify-center 
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              ${task.completed 
                ? 'bg-primary border-2 border-primary' 
                : `bg-transparent border-2 ${priorityClasses.checkboxBorderColor}`
              }
            `}
          >
            {task.completed && <CheckIcon className="h-3.5 w-3.5 text-primary-foreground" />}
          </button>
          <label 
            onClick={() => dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: { taskId: task.id } })}
            className="text-sm text-muted-foreground cursor-pointer"
          >
            {task.completed ? (t('taskDetail.completed') || 'Completed') : (t('taskDetail.markComplete') || 'Mark Complete')}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-secondary">
            <CloseIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="flex-grow p-6 overflow-y-auto">
        <input
          type="text"
          value={task.title}
          onChange={(e) => updateTask({ title: e.target.value })}
          className="text-2xl font-bold bg-transparent w-full focus:outline-none focus:bg-secondary/50 rounded-md p-2"
        />

        {task.recurrence && (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground p-2 bg-secondary/50 rounded-md">
            <RepeatIcon className="h-4 w-4" />
            <span>{t('taskDetail.recurringInfo') || `Repeats ${task.recurrence.type}`}</span>
          </div>
        )}

        {task.totalFocusTime && task.totalFocusTime > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground p-2">
            <StopwatchIcon className="h-5 w-5" />
            <span>{t('taskDetail.focusTime') || `Focus Time: ${formatFocusTime(task.totalFocusTime)}`}</span>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="task-description" className="text-sm font-medium text-muted-foreground">
              {t('taskDetail.descriptionLabel') || 'Description'}
            </label>
            <textarea
              id="task-description"
              value={task.description || ''}
              onChange={(e) => updateTask({ description: e.target.value })}
              rows={4}
              placeholder={t('taskDetail.descriptionPlaceholder') || 'Add description...'}
              className="mt-1 w-full p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                {t('taskDetail.assigneeLabel') || 'Assignee'}
              </label>
              <div className="flex items-center gap-2">
                {assignee ? (
                  <>
                    <Avatar user={assignee} className="w-8 h-8" />
                    <span className="text-sm">{assignee.name}</span>
                  </>
                ) : (
                  <select
                    value={task.assigneeId || ''}
                    onChange={(e) => handleAssignTask(e.target.value || null)}
                    className="w-full p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">{t('taskDetail.unassigned') || 'Unassigned'}</option>
                    {allUsers?.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    )) || []}
                  </select>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="task-priority" className="text-sm font-medium text-muted-foreground">
                {t('taskDetail.priorityLabel') || 'Priority'}
              </label>
              <select
                id="task-priority"
                value={task.priority}
                onChange={(e) => updateTask({ priority: e.target.value as Priority })}
                className="w-full mt-1 p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {Object.entries(PRIORITY_MAP).map(([p, { label }]) => (
                  <option key={p} value={p}>{t(label as any) || p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                {t('taskDetail.dueDateLabel') || 'Due Date'}
              </label>
              <input
                type="date"
                value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => updateTask({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="w-full p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                {t('taskDetail.reminderLabel') || 'Reminder'}
              </label>
              <select
                value={task.reminderMinutes || ''}
                onChange={(e) => updateTask({ reminderMinutes: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">{t('taskDetail.noReminder') || 'No reminder'}</option>
                <option value="5">5 {t('taskDetail.minutes') || 'minutes'} before</option>
                <option value="15">15 {t('taskDetail.minutes') || 'minutes'} before</option>
                <option value="30">30 {t('taskDetail.minutes') || 'minutes'} before</option>
                <option value="60">1 {t('taskDetail.hour') || 'hour'} before</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="tag-input" className="text-sm font-medium text-muted-foreground">
              {t('taskDetail.tagsLabel') || 'Tags'}
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
                placeholder={t('taskDetail.tagsPlaceholder') || 'Add tag...'}
                className="flex-grow bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t('taskDetail.subtasksLabel') || 'Subtasks'}
              </h3>
              {isGeminiAvailable && (
                <button 
                  onClick={handleGenerateSubtasks} 
                  disabled={isGenerating} 
                  className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 disabled:opacity-50"
                >
                  {isGenerating ? '...' : <SparklesIcon className="h-4 w-4" />}
                  {t('taskDetail.generateButton' as any) || 'Generate'}
                </button>
              )}
            </div>
            {task.subtasks.length > 0 && (
              <div className="my-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{t('taskDetail.progressLabel') || 'Progress'}</span>
                  <span>{completedSubtasks} / {task.subtasks.length}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(completedSubtasks / task.subtasks.length) * 100}%` }}
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
                      h-4 w-4 rounded-sm flex-shrink-0
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
                    onChange={(e) => updateTask({ subtasks: task.subtasks.map(sub => sub.id === st.id ? {...sub, title: e.target.value} : sub)})}
                    className={`flex-grow bg-transparent text-sm ${st.completed ? 'line-through text-muted-foreground' : ''} focus:outline-none`} 
                  />
                </div>
              ))}
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2 p-2">
                <input 
                  type="text" 
                  value={newSubtask} 
                  onChange={(e) => setNewSubtask(e.target.value)} 
                  placeholder={t('taskDetail.addSubtaskPlaceholder') || 'Add subtask...'} 
                  className="flex-grow bg-transparent text-sm focus:outline-none" 
                />
                <button type="submit" className="text-primary text-sm font-semibold">
                  {t('taskDetail.addButton') || 'Add'}
                </button>
              </form>
            </div>
          </div>

          {task.comments && task.comments.length > 0 && (
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t('taskDetail.commentsLabel') || 'Comments'}
              </h3>
              <div className="space-y-2">
                {task.comments.map((comment) => {
                  const commentUser = allUsers?.find(u => u.id === comment.userId) || null
                  return (
                    <div key={comment.id} className="flex gap-2 p-2 bg-secondary/50 rounded-md">
                      <Avatar user={commentUser || null} className="w-6 h-6" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{commentUser?.name || 'Unknown'}</p>
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
                  placeholder={t('taskDetail.addCommentPlaceholder') || 'Add comment...'}
                  className="flex-1 p-2 bg-secondary/50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
                  {t('taskDetail.addButton') || 'Add'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
        <button 
          onClick={() => {}} 
          disabled={!isGeminiAvailable}
          className="text-sm w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-secondary hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* TODO: Add GlobeAltIcon */}
          <span>{t('taskDetail.getInfoButton' as any) || 'Get Info'}</span>
        </button>
        <button 
          onClick={handleStartFocus} 
          className="text-sm w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlayCircleIcon className="h-5 w-5" /> 
          {t('taskDetail.startFocusButton') || 'Start Focus'}
        </button>
      </div>
    </div>
  )
}

export default TaskDetail

