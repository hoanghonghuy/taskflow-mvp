"use client"

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { useTaskActions } from '@/lib/hooks/use-task-manager'
import * as aiApi from '@/lib/api/ai'
import { generateId } from '@/lib/utils'
import { useConfirmation } from '@/lib/hooks/use-confirmation'
import type { Task, Subtask, Priority, Comment, RecurrencePattern } from '@/types'
import { buildRecurrencePattern, recurrenceTypeKey } from '@/lib/utils/recurrence'
import { dateOnlyInputToIso, toYYYYMMDD } from '@/lib/utils/date-helpers'
import type { TranslationKey } from '@/lib/i18n/types'
import { 
  CheckIcon, 
  GlobeAltIcon,
  CloseIcon,
  CalendarDayIcon,
  StopwatchIcon,
  SparklesIcon,
  GripVerticalIcon,
  PlayCircleIcon,
  RepeatIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@/lib/icons'
import { PRIORITY_MAP } from '@/lib/task-constants'
import { useGemini } from '@/lib/hooks/use-gemini'
import { useAiFeature } from '@/lib/hooks/use-ai-feature'
import { AI_FEATURES_ENABLED } from '@/lib/feature-flags'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import {
  DetailSection,
  MetaChip,
  PropertyList,
  PropertyRow,
  fieldControlClassName,
} from '@/components/ui/property-list'
import { useUser } from '@/components/providers/user-provider'
import { AccessibleModalSurface } from '@/components/ui/accessible-modal-surface'

interface TaskDetailProps {
  taskId: string
}

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId }) => {
  const { state, dispatch } = useTaskManager()
  const { t, currentLanguage } = useI18n()
  const router = useRouter()
  const { allUsers, user: currentUser } = useUser()
  const { deleteTask, syncSubtasks, syncComments, updateTask: updateTaskApi, toggleTask } = useTaskActions()
  const { confirm } = useConfirmation()
  const { isAvailable: isGeminiAvailable } = useGemini()
  const { runIfEnabled } = useAiFeature()
  const showAiAssist = AI_FEATURES_ENABLED && isGeminiAvailable
  const task = useMemo<Task | null>(() => {
    return state.tasks.find(t => t.id === taskId) ?? null
  }, [state.tasks, taskId])
  const [newSubtask, setNewSubtask] = useState('')
  const [newTag, setNewTag] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedTagIndex, setDraggedTagIndex] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const pendingSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPayloadRef = useRef<Task | null>(null)
  const pendingRollbackRef = useRef<Task | null>(null)
  const updateTaskApiRef = useRef(updateTaskApi)
  updateTaskApiRef.current = updateTaskApi

  useEffect(() => {
    return () => {
      if (pendingSyncRef.current) {
        clearTimeout(pendingSyncRef.current)
        pendingSyncRef.current = null
      }
      const payload = pendingPayloadRef.current
      const rollback = pendingRollbackRef.current
      pendingPayloadRef.current = null
      pendingRollbackRef.current = null
      if (payload) {
        void updateTaskApiRef.current(payload, { silent: true, rollback: rollback ?? undefined })
      }
    }
  }, [taskId])

  if (!task) {
    return null
  }

  const completedSubtasks = task.subtasks.filter(st => st.completed).length
  const parentList = state.lists.find(list => list.id === task.listId) ?? null
  const isReadOnly = Boolean(
    parentList?.ownerUserId &&
      currentUser?.id &&
      parentList.ownerUserId !== currentUser.id,
  )
  const reminderLabels: Record<number, TranslationKey> = {
    5: 'reminder.5min',
    15: 'reminder.15min',
    30: 'reminder.30min',
    60: 'reminder.1hour',
  }
  const reminderDisplay = task.reminderMinutes
    ? t(reminderLabels[task.reminderMinutes] ?? 'taskDetail.noReminder')
    : t('taskDetail.noReminder')
  const recurrenceDisplay = task.recurrence
    ? t(recurrenceTypeKey(task.recurrence.type))
    : t('recurrence.none')
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
    if (pendingSyncRef.current) {
      clearTimeout(pendingSyncRef.current)
      pendingSyncRef.current = null
    }
    const payload = pendingPayloadRef.current
    const rollback = pendingRollbackRef.current
    pendingPayloadRef.current = null
    pendingRollbackRef.current = null
    if (payload) {
      void updateTaskApi(payload, { silent: true, rollback: rollback ?? undefined })
    }
    dispatch({ type: 'SET_SELECTED_TASK', payload: null })
  }

  const applyTaskUpdates = (updates: Partial<Task>, options?: { debounce?: boolean }) => {
    if (isReadOnly) return
    if (!pendingRollbackRef.current) {
      pendingRollbackRef.current = task
    }
    const rollback = pendingRollbackRef.current
    const updatedTask = { ...task, ...updates }
    dispatch({ type: 'UPDATE_TASK', payload: updatedTask })

    if (pendingSyncRef.current) {
      clearTimeout(pendingSyncRef.current)
      pendingSyncRef.current = null
    }

    const runSync = () => {
      pendingSyncRef.current = null
      pendingPayloadRef.current = null
      pendingRollbackRef.current = null
      void updateTaskApi(updatedTask, { silent: true, rollback })
    }

    if (options?.debounce) {
      pendingPayloadRef.current = updatedTask
      pendingSyncRef.current = setTimeout(runSync, 500)
    } else {
      pendingPayloadRef.current = null
      pendingRollbackRef.current = null
      void updateTaskApi(updatedTask, { silent: true, rollback })
    }
  }

  const handleRecurrenceChange = (value: string) => {
    if (!value) {
      applyTaskUpdates({ recurrence: undefined })
      return
    }
    const type = value as RecurrencePattern['type']
    const seriesStart = toYYYYMMDD(task.dueDate ? new Date(task.dueDate) : new Date())
    const updates: Partial<Task> = {
      recurrence: buildRecurrencePattern(type, seriesStart),
    }
    if (!task.dueDate) {
      updates.dueDate = new Date().toISOString()
    }
    applyTaskUpdates(updates)
  }

  const handleRecurrenceIntervalChange = (interval: number) => {
    if (!task.recurrence) return
    applyTaskUpdates({
      recurrence: { ...task.recurrence, interval: Math.max(1, interval) },
    })
  }

  const handleToggleWeekday = (day: number) => {
    if (!task.recurrence || task.recurrence.type !== 'weekly') return
    const current = task.recurrence.daysOfWeek || []
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b)
    applyTaskUpdates({
      recurrence: { ...task.recurrence, daysOfWeek: updated.length > 0 ? updated : undefined },
    })
  }

  const handleRecurrenceEndDateChange = (value: string) => {
    if (!task.recurrence) return
    applyTaskUpdates({
      recurrence: { ...task.recurrence, endDate: value || undefined },
    })
  }

  const handleStartFocus = () => {
    dispatch({ type: 'SET_FOCUSED_TASK', payload: task.id })
    dispatch({ type: 'START_TIMER' })
    router.push('/pomodoro')
    handleClose()
  }

  const handleSubtaskChange = (subtaskId: string, completed: boolean) => {
    if (isReadOnly) return
    const newSubtasks = task.subtasks.map(st => st.id === subtaskId ? { ...st, completed } : st)
    void syncSubtasks(task.id, newSubtasks)
  }

  const handleDeleteSubtask = (subtaskId: string) => {
    if (isReadOnly) return
    const newSubtasks = task.subtasks.filter(st => st.id !== subtaskId)
    void syncSubtasks(task.id, newSubtasks)
  }

  const handleAddSubtask = (e: React.FormEvent) => {
    if (isReadOnly) return
    e.preventDefault()
    if (newSubtask.trim()) {
      const subtask: Subtask = { id: Date.now().toString(), title: newSubtask.trim(), completed: false }
      const newSubtasks = [...task.subtasks, subtask]
      void syncSubtasks(task.id, newSubtasks)
      setNewSubtask('')
    }
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isReadOnly) return
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
    if (isReadOnly) return
    applyTaskUpdates({ tags: task.tags.filter(tag => tag !== tagToRemove) })
  }

  const handleMoveTag = (index: number, offset: -1 | 1) => {
    if (isReadOnly) return
    const targetIndex = index + offset
    if (targetIndex < 0 || targetIndex >= task.tags.length) return
    const tags = [...task.tags]
    ;[tags[index], tags[targetIndex]] = [tags[targetIndex], tags[index]]
    applyTaskUpdates({ tags })
  }

  const handleMoveSubtask = (index: number, offset: -1 | 1) => {
    if (isReadOnly) return
    const targetIndex = index + offset
    if (targetIndex < 0 || targetIndex >= task.subtasks.length) return
    const subtasks = [...task.subtasks]
    ;[subtasks[index], subtasks[targetIndex]] = [subtasks[targetIndex], subtasks[index]]
    void syncSubtasks(task.id, subtasks)
  }

  // Drag and Drop handlers for tags
  const handleTagDragStart = (e: React.DragEvent<HTMLSpanElement>, index: number) => {
    setDraggedTagIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleTagDragOver = (e: React.DragEvent<HTMLSpanElement>) => e.preventDefault()
  const handleTagDrop = (e: React.DragEvent<HTMLSpanElement>, dropIndex: number) => {
    if (isReadOnly) return
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
    runIfEnabled(() => void generateSubtasksWithAi())
  }

  const generateSubtasksWithAi = async () => {
    setIsGenerating(true)
    try {
      const generated = await aiApi.generateSubtasks(
        task.title,
        task.description,
        currentLanguage,
      )
      if (generated.length === 0) return

      const newSubtasks: Subtask[] = generated.map((item) => ({
        id: generateId(),
        title: item.title,
        completed: false,
      }))
      await syncSubtasks(task.id, [...task.subtasks, ...newSubtasks])
    } catch (err) {
      console.error('Failed to generate subtasks', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAssignTask = (userId: string | null) => {
    applyTaskUpdates({ assigneeId: userId })
  }

  const handleDeleteTask = async () => {
    if (isReadOnly) return
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
    if (isReadOnly) return
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
    if (isReadOnly) return
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
    <AccessibleModalSurface
      aria-label={task.title}
      onClose={handleClose}
      className="flex h-full w-full flex-col overflow-hidden border-l border-border bg-card shadow-[-8px_0_24px_rgba(0,0,0,0.06)] md:max-w-xl md:animate-slide-in"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-secondary/20 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => { if (!isReadOnly) void toggleTask(task.id) }}
            disabled={isReadOnly}
            aria-label={task.completed ? t('taskItem.aria.markIncomplete') : t('taskItem.aria.markComplete')}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''} ${task.completed ? 'border-primary bg-primary' : `bg-background ${priorityClasses.checkboxBorderColor}`}`}
          >
            {task.completed && <CheckIcon className="h-3.5 w-3.5 text-primary-foreground" />}
          </button>
          <div className="min-w-0">
            <button
              onClick={() => { if (!isReadOnly) void toggleTask(task.id) }}
              disabled={isReadOnly}
              className={`text-sm font-semibold text-left ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'hover:text-primary'}`}
            >
              {task.completed ? t('taskDetail.completed') : t('taskDetail.markComplete')}
            </button>
            {parentList && (
              <p className="truncate text-xs text-muted-foreground">
                {t('task.list')}: <span className="font-medium text-foreground/80">{parentList.name}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleDeleteTask}
              className="rounded-md px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              {t('task.delete')}
            </button>
          )}
          <button
            onClick={handleClose}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={t('common.close')}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {isReadOnly && (
        <div className="border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          {t('taskDetail.sharedReadOnly')}
        </div>
      )}

      <div className="grow space-y-5 overflow-y-auto px-4 py-5 sm:px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
        <section className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <input
              type="text"
              value={task.title}
              readOnly={isReadOnly}
              aria-label={t('taskDetail.titleLabel')}
              onChange={(e) => applyTaskUpdates({ title: e.target.value }, { debounce: true })}
              className={`w-full bg-transparent text-2xl font-semibold tracking-tight focus:outline-none md:text-[1.7rem] ${isReadOnly ? 'cursor-default' : ''}`}
            />
            <span className={`mt-1 inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${priorityClasses.checkboxBorderColor.replace('border-', 'border')} ${priorityClasses.color}`}>
              {t(priorityClasses.label)}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {createdAtDisplay && (
              <MetaChip>
                <span className="font-medium text-foreground/70">{t('taskDetail.createdAtLabel')}</span>
                <span>{createdAtDisplay}</span>
              </MetaChip>
            )}
            {task.dueDate && (
              <MetaChip>
                <CalendarDayIcon className="h-3.5 w-3.5" />
                <span>{dueDateDisplay}</span>
              </MetaChip>
            )}
            {task.totalFocusTime && task.totalFocusTime > 0 && (
              <MetaChip>
                <StopwatchIcon className="h-3.5 w-3.5" />
                <span>{formatFocusTime(task.totalFocusTime)}</span>
              </MetaChip>
            )}
            {task.subtasks.length > 0 && (
              <MetaChip>
                <GripVerticalIcon className="h-3.5 w-3.5" />
                <span>{completedSubtasks} / {task.subtasks.length} {t('taskDetail.subtasksLabel')}</span>
              </MetaChip>
            )}
            {task.reminderMinutes && (
              <MetaChip>
                <GlobeAltIcon className="h-3.5 w-3.5" />
                <span>{reminderDisplay}</span>
              </MetaChip>
            )}
            {task.recurrence && (
              <MetaChip>
                <RepeatIcon className="h-3.5 w-3.5" />
                <span>{recurrenceDisplay}</span>
              </MetaChip>
            )}
          </div>
        </section>

        <DetailSection title={t('taskDetail.descriptionLabel')} flush>
          <textarea
            id="task-description"
            value={task.description || ''}
            readOnly={isReadOnly}
            aria-label={t('taskDetail.descriptionLabel')}
            onChange={(e) => applyTaskUpdates({ description: e.target.value }, { debounce: true })}
            rows={4}
            placeholder={t('taskDetail.descriptionPlaceholder')}
            className="w-full resize-none border-0 bg-transparent px-3.5 py-3 text-sm leading-relaxed focus:outline-none focus:ring-0"
          />
        </DetailSection>

        <PropertyList title={t('task.viewDetails')}>
          <PropertyRow label={t('taskDetail.assigneeLabel')} controlId="task-assignee">
            <select
              id="task-assignee"
              value={task.assigneeId || ''}
              disabled={isReadOnly}
              onChange={(e) => handleAssignTask(e.target.value || null)}
              className={fieldControlClassName}
            >
              <option value="">{t('taskDetail.unassigned')}</option>
              {allUsers?.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              )) || []}
            </select>
          </PropertyRow>
          <PropertyRow label={t('taskDetail.priorityLabel')} controlId="task-priority">
            <select
              id="task-priority"
              value={task.priority}
              disabled={isReadOnly}
              onChange={(e) => applyTaskUpdates({ priority: e.target.value as Priority })}
              className={fieldControlClassName}
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
          </PropertyRow>
          <PropertyRow label={t('taskDetail.dueDateLabel')} controlId="task-due-date">
            <input
              id="task-due-date"
              type="date"
              value={task.dueDate ? toYYYYMMDD(new Date(task.dueDate)) : ''}
              readOnly={isReadOnly}
              onChange={(e) => applyTaskUpdates({ dueDate: e.target.value ? dateOnlyInputToIso(e.target.value) : undefined })}
              className={fieldControlClassName}
            />
          </PropertyRow>
          <PropertyRow label={t('taskDetail.reminderLabel')} controlId="task-reminder">
            <select
              id="task-reminder"
              value={task.reminderMinutes || ''}
              disabled={isReadOnly}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined
                applyTaskUpdates({ reminderMinutes: value })
              }}
              className={fieldControlClassName}
            >
              <option value="">{t('taskDetail.noReminder')}</option>
              <option value="5">5 {t('taskDetail.minutes')}</option>
              <option value="15">15 {t('taskDetail.minutes')}</option>
              <option value="30">30 {t('taskDetail.minutes')}</option>
              <option value="60">1 {t('taskDetail.hour')}</option>
            </select>
          </PropertyRow>
          <PropertyRow label={t('taskDetail.recurrenceLabel')} controlId="task-recurrence" align="start">
            <div className="space-y-3">
              <select
                id="task-recurrence"
                value={task.recurrence?.type ?? ''}
                disabled={isReadOnly}
                onChange={(e) => handleRecurrenceChange(e.target.value)}
                className={fieldControlClassName}
              >
                <option value="">{t('recurrence.none')}</option>
                <option value="daily">{t('recurrence.daily')}</option>
                <option value="weekly">{t('recurrence.weekly')}</option>
                <option value="monthly">{t('recurrence.monthly')}</option>
              </select>
              {task.recurrence && (
                <div className="space-y-3 rounded-lg border border-border/60 bg-background/60 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t('recurrence.interval')}</span>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={task.recurrence.interval || 1}
                      disabled={isReadOnly}
                      onChange={(e) => handleRecurrenceIntervalChange(parseInt(e.target.value) || 1)}
                      className="w-16 rounded-md border border-border bg-background p-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                    />
                    <span className="text-xs text-muted-foreground">
                      {task.recurrence.type === 'daily'
                        ? (task.recurrence.interval || 1) === 1
                          ? t('recurrence.day')
                          : t('recurrence.days')
                        : task.recurrence.type === 'weekly'
                          ? (task.recurrence.interval || 1) === 1
                            ? t('recurrence.week')
                            : t('recurrence.weeks')
                          : (task.recurrence.interval || 1) === 1
                            ? t('recurrence.month')
                            : t('recurrence.months')}
                    </span>
                  </div>
                  {task.recurrence.type === 'weekly' && (
                    <div>
                      <div className="mb-2 text-xs text-muted-foreground">{t('recurrence.on')}</div>
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                          const labels = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
                          const isSelected = (task.recurrence?.daysOfWeek || []).includes(day)
                          return (
                            <button
                              key={day}
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => handleToggleWeekday(day)}
                              className={`flex-1 rounded-md px-1.5 py-1.5 text-[11px] font-medium transition-colors ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'border border-border/70 bg-secondary/50 text-muted-foreground hover:bg-muted'
                              } ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                              {t(`recurrence.weekdays.${labels[day]}` as TranslationKey)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="mb-2 text-xs text-muted-foreground">{t('recurrence.endDate')}</div>
                    <input
                      type="date"
                      value={
                        task.recurrence.endDate
                          ? /^\d{4}-\d{2}-\d{2}$/.test(task.recurrence.endDate)
                            ? task.recurrence.endDate
                            : toYYYYMMDD(new Date(task.recurrence.endDate))
                          : ''
                      }
                      disabled={isReadOnly}
                      onChange={(e) => handleRecurrenceEndDateChange(e.target.value)}
                      className={fieldControlClassName}
                      placeholder={t('recurrence.noEndDate')}
                    />
                  </div>
                </div>
              )}
            </div>
          </PropertyRow>
        </PropertyList>

        <DetailSection title={t('taskDetail.tagsLabel')}>
          <div className="flex flex-wrap items-center gap-2">
            {task.tags.map((tag, index) => (
              <span
                key={tag}
                draggable={!isReadOnly}
                onDragStart={(e) => handleTagDragStart(e, index)}
                onDragOver={handleTagDragOver}
                onDrop={(e) => handleTagDrop(e, index)}
                onDragEnd={handleTagDragEnd}
                className={`inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-medium shadow-sm transition-opacity ${draggedTagIndex === index ? 'opacity-50' : 'opacity-100'} ${isReadOnly ? '' : 'cursor-move'}`}
              >
                {tag}
                {!isReadOnly && (
                  <>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveTag(index, -1)}
                      aria-label={t('common.moveUp')}
                      className="rounded-full p-0.5 hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowUpIcon className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === task.tags.length - 1}
                      onClick={() => handleMoveTag(index, 1)}
                      aria-label={t('common.moveDown')}
                      className="rounded-full p-0.5 hover:bg-muted disabled:opacity-30"
                    >
                      <ArrowDownIcon className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={t('taskForm.removeTagAria', { tag })}
                      className="z-10 rounded-full p-0.5 hover:bg-muted"
                    >
                      <CloseIcon className="h-3 w-3" />
                    </button>
                  </>
                )}
              </span>
            ))}
            {!isReadOnly && (
              <input
                id="tag-input"
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={t('taskDetail.tagsPlaceholder')}
                className="min-w-[8rem] grow bg-transparent text-sm focus:outline-none"
              />
            )}
          </div>
        </DetailSection>

        <DetailSection
          title={t('taskDetail.subtasksLabel')}
          action={
            showAiAssist ? (
              <button
                onClick={handleGenerateSubtasks}
                disabled={isGenerating}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-primary hover:bg-primary/10 disabled:opacity-50"
              >
                {isGenerating ? '...' : <SparklesIcon className="h-3.5 w-3.5" />}
                {t('taskDetail.generateButton')}
              </button>
            ) : undefined
          }
        >
          <div className="space-y-2">
            {task.subtasks.length > 0 && (
              <div className="space-y-1.5 pb-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{t('taskDetail.progressLabel')}</span>
                  <span className="font-medium tabular-nums">{completedSubtasks} / {task.subtasks.length}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              {task.subtasks.map((st, index) => (
                <div
                  key={st.id}
                  draggable={!isReadOnly}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group flex items-center gap-2 rounded-lg border border-border/50 bg-background/70 px-2 py-2 transition-opacity ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
                >
                  <GripVerticalIcon className="h-4 w-4 cursor-move text-muted-foreground/40 group-hover:text-muted-foreground" />
                  {!isReadOnly && (
                    <div className="flex shrink-0 flex-col">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveSubtask(index, -1)}
                        aria-label={t('common.moveUp')}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                      >
                        <ArrowUpIcon className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={index === task.subtasks.length - 1}
                        onClick={() => handleMoveSubtask(index, 1)}
                        aria-label={t('common.moveDown')}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                      >
                        <ArrowDownIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => handleSubtaskChange(st.id, !st.completed)}
                    disabled={isReadOnly}
                    aria-label={st.completed ? t('taskItem.aria.markIncomplete') : t('taskItem.aria.markComplete')}
                    className={`
                      -m-3 flex size-11 shrink-0 items-center justify-center rounded-md transition-all duration-150 md:m-0 md:size-4
                      focus:outline-none focus:ring-1 focus:ring-ring
                      ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}
                    `}
                  >
                    <span
                      className={`flex size-4 items-center justify-center rounded-sm border ${
                        st.completed
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/45 bg-transparent'
                      }`}
                    >
                      {st.completed && <CheckIcon className="h-2.5 w-2.5 text-primary-foreground" />}
                    </span>
                  </button>
                  <input
                    type="text"
                    value={st.title}
                    readOnly={isReadOnly}
                    onChange={(e) => {
                      if (isReadOnly) return
                      const newSubtasks = task.subtasks.map(sub =>
                        sub.id === st.id ? { ...sub, title: e.target.value } : sub
                      )
                      void syncSubtasks(task.id, newSubtasks)
                    }}
                    className={`grow bg-transparent text-sm focus:outline-none ${st.completed ? 'text-muted-foreground line-through' : ''}`}
                  />
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(st.id)}
                      aria-label={t('taskDetail.aria.deleteSubtask' as TranslationKey)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-muted md:size-6"
                    >
                      <CloseIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {!isReadOnly && (
                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 rounded-lg border border-dashed border-border/70 px-2 py-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder={t('taskDetail.addSubtaskPlaceholder')}
                    className="grow bg-transparent text-sm focus:outline-none"
                  />
                  <button type="submit" className="text-sm font-semibold text-primary hover:text-primary/80">
                    {t('taskDetail.addButton')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </DetailSection>

        <DetailSection title={t('taskDetail.commentsLabel')}>
          <div className="space-y-3">
            {task.comments.length > 0 && (
              <div className="space-y-2">
                {task.comments.map((comment) => {
                  const commentUser = allUsers?.find(u => u.id === comment.userId) || null
                  return (
                    <div key={comment.id} className="flex gap-2.5 rounded-lg border border-border/50 bg-background/70 p-2.5">
                      <Avatar user={commentUser || null} className="h-6 w-6" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground/80">{commentUser?.name || t('comments.unknownUser')}</p>
                        <p className="text-sm leading-relaxed">{comment.content}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {new Date(comment.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {!isReadOnly && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const input = e.currentTarget.querySelector('input') as HTMLInputElement
                  if (input?.value.trim()) {
                    handleAddComment(input.value.trim())
                    input.value = ''
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder={t('taskDetail.addCommentPlaceholder')}
                  className={`flex-1 ${fieldControlClassName}`}
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  {t('taskDetail.addButton')}
                </button>
              </form>
            )}
          </div>
        </DetailSection>
      </div>

      <div className="shrink-0 border-t border-border bg-secondary/20 p-4">
        <button
          onClick={handleStartFocus}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <PlayCircleIcon className="h-5 w-5" />
          {t('taskDetail.startFocusButton')}
        </button>
      </div>
    </AccessibleModalSurface>
  )
}

export default TaskDetail

