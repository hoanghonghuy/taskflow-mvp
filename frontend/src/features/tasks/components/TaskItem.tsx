"use client"

import React, { useState } from 'react'
import { Task, Priority } from '@/types'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useTaskActions } from '@/lib/hooks/use-task-manager'
import { useConfirmation } from '@/lib/hooks/use-confirmation'
import {
  PlayCircleIcon,
  BellIcon,
  RepeatIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckIcon,
  TrashIcon,
} from '@/lib/icons'
import { PRIORITY_MAP } from '@/lib/task-constants'
import { useUser } from '@/components/providers/user-provider'
import { Avatar } from '@/components/ui/avatar'
import { useI18n } from '@/lib/i18n/hooks'
import { useSettings } from '@/components/providers/settings-provider'
import { HighlightText } from '@/components/ui/highlight-text'
import { IconButton } from '@/components/ui/icon-button'
import { isSharedListMember } from '@/lib/utils/list-access'

const isToday = (date: Date): boolean => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

const isPast = (date: Date): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

interface TaskItemProps {
  task: Task
  isDraggable: boolean
  onDragStart?: (taskId: string) => void
  onDrop?: (droppedOnId: string) => void
  listName?: string
  highlightTerm?: string
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isDraggable,
  onDragStart,
  onDrop,
  listName,
  highlightTerm,
}) => {
  const { state, dispatch } = useTaskManager()
  const { t } = useI18n()
  const { settings } = useSettings()
  const { user, allUsers } = useUser()
  const { deleteTask, syncSubtasks, toggleTask } = useTaskActions()
  const { confirm } = useConfirmation()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSubtasksOpen, setIsSubtasksOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const originalId = task.id.split('_')[0]
    return window.localStorage.getItem(`task-subtasks-open-${originalId}`) === 'true'
  })

  const parentList = state.lists.find((list) => list.id === task.listId) ?? null
  const isReadOnly = isSharedListMember(parentList, user?.id)
  const canDrag = isDraggable && !task.completed && !isReadOnly
  const assignee = allUsers?.find((candidate) => candidate.id === task.assigneeId) || null

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (isReadOnly) return
    void toggleTask(task.id)
  }

  const handleToggleSubtasksVisibility = (event: React.MouseEvent) => {
    event.stopPropagation()
    setIsSubtasksOpen((previous) => {
      const next = !previous
      if (typeof window !== 'undefined') {
        const originalId = task.id.split('_')[0]
        window.localStorage.setItem(`task-subtasks-open-${originalId}`, next ? 'true' : 'false')
      }
      return next
    })
  }

  const handleSubtaskToggle = (event: React.MouseEvent, subtaskId: string) => {
    event.stopPropagation()
    if (isReadOnly) return
    const newSubtasks = task.subtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask,
    )
    void syncSubtasks(task.id, newSubtasks)
  }

  const handleSelect = () => {
    dispatch({ type: 'SET_SELECTED_TASK', payload: task.id.split('_')[0] })
  }

  const handleStartFocus = (event: React.MouseEvent) => {
    event.stopPropagation()
    dispatch({ type: 'SET_FOCUSED_TASK', payload: task.id.split('_')[0] })
    dispatch({ type: 'START_TIMER' })
  }

  const handleQuickDelete = async (event: React.MouseEvent) => {
    event.stopPropagation()
    if (isReadOnly) return
    const ok = await confirm({
      title: t('taskDetail.deleteConfirm.title', { title: task.title }),
      description: t('taskDetail.deleteConfirm.description', { title: task.title }),
      confirmText: t('taskDetail.deleteConfirm.confirm'),
      variant: 'destructive',
    })
    if (ok) void deleteTask(task.id)
  }

  const handleDragStart = (event: React.DragEvent) => {
    event.stopPropagation()
    if (!canDrag || !onDragStart) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('taskId', task.id.split('_')[0])
    onDragStart(task.id)
  }

  const handleDrop = (event: React.DragEvent) => {
    if (canDrag && onDrop) {
      event.stopPropagation()
      onDrop(task.id)
    }
    setIsDragOver(false)
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (canDrag) setIsDragOver(true)
  }

  const taskPriority = (task.priority || 'none') as Priority
  const priorityClasses = PRIORITY_MAP[taskPriority] || PRIORITY_MAP.none
  const checkboxStyle = !task.completed
    ? { borderColor: priorityClasses.checkboxBorderValue }
    : undefined

  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const dueDateIsPast = dueDate ? isPast(dueDate) && !isToday(dueDate) : false
  const locale = settings.language || undefined
  const completedSubtasks = task.subtasks.filter((subtask) => subtask.completed).length

  return (
    <div>
      <div
        onClick={handleSelect}
        draggable={canDrag}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={(event) => {
          event.stopPropagation()
          setIsDragOver(false)
        }}
        onDragEnd={() => setIsDragOver(false)}
        className={`group relative flex min-h-16 items-center gap-3 border border-border/60 bg-card px-3 py-3 transition-[border-color,box-shadow,background-color,opacity,transform] duration-150 motion-reduce:transition-none sm:px-4 ${
          task.subtasks.length > 0 && isSubtasksOpen ? 'rounded-t-xl' : 'rounded-xl'
        } ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${
          task.completed ? 'opacity-60' : 'opacity-100'
        } ${
          isDragOver
            ? 'border-primary/60 bg-primary/5 shadow-md'
            : 'hover:border-border hover:shadow-sm focus-within:border-primary/40'
        }`}
      >
        <button
          type="button"
          onClick={handleToggle}
          disabled={isReadOnly}
          aria-label={task.completed ? t('taskItem.aria.markIncomplete') : t('taskItem.aria.markComplete')}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-[transform,background-color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none ${
            isReadOnly ? 'cursor-not-allowed opacity-60' : 'hover:scale-105'
          } ${task.completed ? 'border-primary bg-primary' : `bg-transparent ${priorityClasses.checkboxBorderColor}`}`}
          style={checkboxStyle}
        >
          {task.completed && <CheckIcon className="h-4 w-4 text-primary-foreground" />}
        </button>

        <button
          type="button"
          aria-label={task.title}
          onClick={(event) => {
            event.stopPropagation()
            handleSelect()
          }}
          className="min-w-0 flex-1 text-left focus-visible:outline-none"
        >
          <p
            className={`truncate text-sm font-medium leading-5 ${
              task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}
          >
            <HighlightText text={task.title} term={highlightTerm} />
          </p>

          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {listName && <span className="max-w-36 truncate">{listName}</span>}
            {dueDate && (
              <span className={dueDateIsPast ? 'font-medium text-destructive' : undefined}>
                {dueDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
              </span>
            )}
            {task.subtasks.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                {completedSubtasks}/{task.subtasks.length}
              </span>
            )}
            {task.recurrence && (
              <RepeatIcon
                className="h-3.5 w-3.5"
                title={t('taskItem.title.repeats', { rule: task.recurrence.type })}
              />
            )}
            {task.reminderMinutes && (
              <BellIcon
                className="h-3.5 w-3.5"
                title={t('taskItem.title.reminder', { minutes: task.reminderMinutes })}
              />
            )}
          </div>
        </button>

        {assignee && <Avatar user={assignee} className="h-7 w-7 shrink-0" />}

        <div className="flex shrink-0 items-center gap-0.5">
          {task.subtasks.length > 0 && (
            <IconButton
              onClick={handleToggleSubtasksVisibility}
              size="md"
              variant="toolbar"
              aria-label={`${task.title}: ${completedSubtasks}/${task.subtasks.length}`}
              className="rounded-lg"
            >
              {isSubtasksOpen ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
            </IconButton>
          )}

          {!task.completed && (
            <IconButton
              onClick={handleStartFocus}
              size="md"
              variant="toolbar"
              revealOnHover
              className="rounded-lg hover:text-primary"
              aria-label={t('taskItem.aria.startFocus')}
            >
              <PlayCircleIcon className="h-5 w-5" />
            </IconButton>
          )}

          {!isReadOnly && (
            <IconButton
              onClick={handleQuickDelete}
              size="md"
              variant="destructive"
              revealOnHover
              className="rounded-lg"
              aria-label={t('task.delete')}
            >
              <TrashIcon className="h-4.5 w-4.5" />
            </IconButton>
          )}
        </div>
      </div>

      {isSubtasksOpen && task.subtasks.length > 0 && (
        <div className="rounded-b-xl border border-t-0 border-border/60 bg-card/70 px-4 pb-3 pt-2 animate-accordion-down motion-reduce:animate-none sm:pl-12">
          <div className="space-y-1.5">
            {task.subtasks.map((subtask) => (
              <div key={subtask.id} className="flex min-h-9 items-center gap-3 rounded-lg px-2 hover:bg-secondary/45">
                <button
                  type="button"
                  onClick={(event) => handleSubtaskToggle(event, subtask.id)}
                  disabled={isReadOnly}
                  aria-label={subtask.completed ? t('taskItem.aria.markIncomplete') : t('taskItem.aria.markComplete')}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring motion-reduce:transition-none ${
                    subtask.completed
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/50 bg-transparent'
                  } ${isReadOnly ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  {subtask.completed && <CheckIcon className="h-2.5 w-2.5 text-primary-foreground" />}
                </button>
                <p
                  className={`min-w-0 flex-1 truncate text-sm ${
                    subtask.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                  }`}
                >
                  {subtask.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskItem
