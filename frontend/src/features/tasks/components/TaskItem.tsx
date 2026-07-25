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

// Helper functions to replace date-fns
const isToday = (date: Date): boolean => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

const isPast = (date: Date): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Compare with start of today
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

const TaskItem: React.FC<TaskItemProps> = ({ task, isDraggable, onDragStart, onDrop, listName, highlightTerm }) => {
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
    const stored = window.localStorage.getItem(`task-subtasks-open-${originalId}`)
    return stored === 'true'
  })

  const parentList = state.lists.find((list) => list.id === task.listId) ?? null
  const isReadOnly = isSharedListMember(parentList, user?.id)
  const canDrag = isDraggable && !task.completed && !isReadOnly

  const assignee = allUsers?.find(u => u.id === task.assigneeId) || null

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isReadOnly) return
    void toggleTask(task.id)
  }

  const handleToggleSubtasksVisibility = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsSubtasksOpen(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        const originalId = task.id.split('_')[0]
        window.localStorage.setItem(`task-subtasks-open-${originalId}`, next ? 'true' : 'false')
      }
      return next
    })
  }

  const handleSubtaskToggle = (e: React.MouseEvent, subtaskId: string) => {
    e.stopPropagation()
    if (isReadOnly) return
    const newSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    )
    void syncSubtasks(task.id, newSubtasks)
  }

  const handleSelect = () => {
    const originalId = task.id.split('_')[0] // Handle recurring instances
    dispatch({ type: 'SET_SELECTED_TASK', payload: originalId })
  }

  const handleStartFocus = (e: React.MouseEvent) => {
    e.stopPropagation()
    const originalId = task.id.split('_')[0]
    dispatch({ type: 'SET_FOCUSED_TASK', payload: originalId })
    dispatch({ type: 'START_TIMER' })
  }

  const handleQuickDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isReadOnly) return
    const ok = await confirm({
      title: t('taskDetail.deleteConfirm.title', { title: task.title }),
      description: t('taskDetail.deleteConfirm.description', { title: task.title }),
      confirmText: t('taskDetail.deleteConfirm.confirm'),
      variant: 'destructive',
    })
    if (!ok) return
    void deleteTask(task.id)
  }
  
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation()
    if (canDrag && onDragStart) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('taskId', task.id.split('_')[0])
      onDragStart(task.id)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    if (canDrag && onDrop) {
      e.stopPropagation()
      onDrop(task.id)
    }
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Necessary for drop to work
    e.stopPropagation()
    if (isDraggable) {
      setIsDragOver(true)
    }
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation()
    setIsDragOver(false)
  }

  const dueDateLabel = () => {
    if (!task.dueDate) return null
    const date = new Date(task.dueDate)
    const isDuePast = isPast(date) && !isToday(date)
    const color = isDuePast ? 'text-destructive' : 'text-muted-foreground'

    const locale = settings.language || undefined

    return (
      <span className={`text-xs ${color}`}>
        {date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
      </span>
    )
  }
  
  // Ensure task has a priority, default to 'none'
  const taskPriority = (task.priority || 'none') as Priority
  const priorityClasses = PRIORITY_MAP[taskPriority] || PRIORITY_MAP['none']
  const checkboxStyle = !task.completed
    ? { borderColor: priorityClasses.checkboxBorderValue }
    : undefined

  const progressIndicator = () => {
    if (task.subtasks && task.subtasks.length > 0) {
      const completed = task.subtasks.filter(st => st.completed).length
      return (
        <span className="text-xs flex items-center gap-1 text-muted-foreground">
          <CheckCircleIcon className="h-4 w-4" />
          {completed}/{task.subtasks.length}
        </span>
      )
    }
    return null
  }

  return (
    <div>
      <div 
        onClick={handleSelect}
        draggable={canDrag}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnd={() => setIsDragOver(false)}
        className={`
          group flex items-center p-3 bg-card shadow-sm relative
          transition-[box-shadow,background-color,opacity] duration-200 ease-in-out
          ${canDrag ? 'cursor-grab' : 'cursor-pointer'}
          ${task.completed ? 'opacity-50' : 'opacity-100'}
          ${isDragOver ? 'bg-primary/10 shadow-lg' : 'hover:shadow-md'}
          ${task.subtasks.length > 0 && isSubtasksOpen ? 'rounded-t-lg' : 'rounded-lg'}
        `}
      >
        <button
          onClick={handleToggle}
          disabled={isReadOnly}
          aria-label={task.completed ? t('taskItem.aria.markIncomplete') : t('taskItem.aria.markComplete')}
          className={`
            h-5 w-5 rounded shrink-0
            flex items-center justify-center 
            transition-transform duration-150 transform hover:scale-110
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
            ${isReadOnly ? 'cursor-not-allowed opacity-60' : ''}
            ${task.completed 
              ? 'bg-primary border-2 border-primary' 
              : `bg-transparent border-2 ${priorityClasses.checkboxBorderColor}`
            }
          `}
          style={checkboxStyle}
        >
          {task.completed && <CheckIcon className="h-3.5 w-3.5 text-primary-foreground" />}
        </button>
        <div className="ml-4 grow flex items-center gap-2 min-w-0">
          <button
            type="button"
            aria-label={task.title}
            onClick={(event) => {
              event.stopPropagation()
              handleSelect()
            }}
            className="flex min-w-0 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className={`text-sm truncate ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              <HighlightText text={task.title} term={highlightTerm} />
            </p>
            {listName && (
              <span className="text-[11px] text-muted-foreground truncate">{listName}</span>
            )}
          </button>
          {task.subtasks.length > 0 && (
            <IconButton
              onClick={handleToggleSubtasksVisibility}
              size="sm"
              variant="toolbar"
              revealOnHover
              className="rounded-full"
            >
              {isSubtasksOpen ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
            </IconButton>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
          {!task.completed && (
            <IconButton
              onClick={handleStartFocus}
              size="lg"
              revealOnHover
              className="hover:text-primary"
              aria-label={t('taskItem.aria.startFocus')}
            >
              <PlayCircleIcon className="h-6 w-6" />
            </IconButton>
          )}
          {!isReadOnly && (
            <IconButton
              onClick={handleQuickDelete}
              size="md"
              variant="destructive"
              revealOnHover
              aria-label={t('task.delete')}
            >
              <TrashIcon className="h-5 w-5" />
            </IconButton>
          )}
          <div className="flex items-center gap-1.5">
            {progressIndicator()}
            {dueDateLabel()}
            {task.recurrence && <RepeatIcon className="h-4 w-4" title={t('taskItem.title.repeats', { rule: task.recurrence.type })} />}
            {task.reminderMinutes && <BellIcon className="h-4 w-4" title={t('taskItem.title.reminder', { minutes: task.reminderMinutes })} />}
            {assignee && <Avatar user={assignee} className="h-5 w-5 md:h-6 md:w-6 shrink-0" />}
          </div>
        </div>
      </div>
      {isSubtasksOpen && task.subtasks.length > 0 && (
        <div className="bg-card rounded-b-lg pl-8 pr-4 pb-3 pt-3 border border-t-0 border-border">
          <div className="space-y-2">
            {task.subtasks.map(subtask => (
              <div key={subtask.id} className="flex items-center gap-3">
                <button
                  onClick={(e) => handleSubtaskToggle(e, subtask.id)}
                  aria-label={subtask.completed ? t('taskItem.aria.markIncomplete') : t('taskItem.aria.markComplete')}
                  className={`
                    h-4 w-4 rounded-sm shrink-0
                    flex items-center justify-center 
                    transition-colors duration-150
                    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
                    ${subtask.completed 
                      ? 'bg-primary border border-primary' 
                      : 'bg-transparent border border-muted-foreground/50'
                    }
                  `}
                >
                  {subtask.completed && <CheckIcon className="h-2.5 w-2.5 text-primary-foreground" />}
                </button>
                <p className={`text-sm grow ${subtask.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
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

