'use client'

import React, { useState } from 'react'
import { Task } from '@/types'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { PRIORITY_MAP, PlayCircleIcon, BellIcon, RepeatIcon, CheckCircleIcon, ArrowUpIcon, ArrowDownIcon, CheckIcon } from '@/lib/constants'
import { useUser } from '@/components/providers/user-provider'
import { Avatar } from '@/components/ui/avatar'
import { useI18n } from '@/lib/hooks/use-i18n'

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
}

const TaskItem: React.FC<TaskItemProps> = ({ task, isDraggable, onDragStart, onDrop, listName }) => {
  const { dispatch } = useTaskManager()
  const { t } = useI18n()
  const { allUsers } = useUser()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSubtasksOpen, setIsSubtasksOpen] = useState(true)

  const assignee = allUsers?.find(u => u.id === task.assigneeId) || null

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: { taskId: task.id } })
  }

  const handleSubtaskToggle = (e: React.MouseEvent, subtaskId: string) => {
    e.stopPropagation()
    const newSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    )
    dispatch({ type: 'UPDATE_TASK', payload: { ...task, subtasks: newSubtasks } })
  }

  const handleSelect = () => {
    const originalId = task.id.split('_')[0] // Handle recurring instances
    dispatch({ type: 'SET_SELECTED_TASK', payload: originalId })
  }

  const handleStartFocus = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'SET_FOCUSED_TASK', payload: task.id })
    dispatch({ type: 'START_TIMER' })
  }
  
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation()
    if (isDraggable && onDragStart) {
      e.dataTransfer.effectAllowed = 'move'
      onDragStart(task.id)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.stopPropagation()
    if (isDraggable && onDrop) {
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
    
    return <span className={`text-xs ${color}`}>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
  }
  
  const priorityClasses = PRIORITY_MAP[task.priority] || PRIORITY_MAP['none']

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
        draggable={isDraggable && !task.completed}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnd={() => setIsDragOver(false)}
        className={`
          group flex items-center p-3 bg-card shadow-sm relative
          transition-all duration-200 ease-in-out
          ${isDraggable && !task.completed ? 'cursor-grab' : 'cursor-pointer'}
          ${task.completed ? 'opacity-50' : 'opacity-100'}
          ${isDragOver ? 'bg-primary/10 shadow-lg' : 'hover:shadow-md'}
          ${task.subtasks.length > 0 && isSubtasksOpen ? 'rounded-t-lg' : 'rounded-lg'}
        `}
      >
        <button
          onClick={handleToggle}
          aria-label={task.completed ? t('taskItem.aria.markIncomplete') : t('taskItem.aria.markComplete')}
          className={`
            h-5 w-5 rounded flex-shrink-0
            flex items-center justify-center 
            transition-all duration-150 transform hover:scale-110
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
            ${task.completed 
              ? 'bg-primary border-2 border-primary' 
              : `bg-transparent border-2 ${priorityClasses.checkboxBorderColor}`
            }
          `}
        >
          {task.completed && <CheckIcon className="h-3.5 w-3.5 text-primary-foreground" />}
        </button>
        <div className="ml-4 flex-grow flex items-center gap-2">
          <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </p>
          {task.subtasks.length > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setIsSubtasksOpen(!isSubtasksOpen); }} className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-secondary transition-opacity">
              {isSubtasksOpen ? <ArrowUpIcon className="h-4 w-4 text-muted-foreground" /> : <ArrowDownIcon className="h-4 w-4 text-muted-foreground" />}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 ml-auto text-sm text-muted-foreground">
          {!task.completed && (
            <button
              onClick={handleStartFocus}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
              aria-label={t('taskItem.aria.startFocus')}
            >
              <PlayCircleIcon className="h-6 w-6" />
            </button>
          )}
          <div className="flex items-center gap-2">
            {listName && <span className="text-xs bg-secondary px-1.5 py-0.5 rounded-md">{listName}</span>}
            {progressIndicator()}
            {dueDateLabel()}
            {task.recurrence && <RepeatIcon className="h-4 w-4" title={t('taskItem.title.repeats', { rule: task.recurrence.type })} />}
            {task.reminderMinutes && <BellIcon className="h-4 w-4" title={t('taskItem.title.reminder', { minutes: task.reminderMinutes })} />}
            {assignee && <Avatar user={assignee} className="w-5 h-5" />}
          </div>
        </div>
      </div>
      {isSubtasksOpen && task.subtasks.length > 0 && (
        <div className={`bg-card rounded-b-lg pl-6 pr-4 pb-3 pt-2 animate-accordion-down`}>
          <div className="relative">
            <div className="absolute left-4 top-0 w-px h-full bg-border"></div>
            <div className="space-y-2">
              {task.subtasks.map(subtask => (
                <div key={subtask.id} className="flex items-center group relative pl-8">
                  <div className="absolute left-4 top-1/2 w-4 h-px bg-border -translate-y-1/2"></div>
                  <div className="flex items-center gap-3 w-full">
                    <button
                      onClick={(e) => handleSubtaskToggle(e, subtask.id)}
                      aria-label={subtask.completed ? t('taskItem.aria.markIncomplete') : t('taskItem.aria.markComplete')}
                      className={`
                        h-4 w-4 rounded-sm flex-shrink-0
                        flex items-center justify-center 
                        transition-all duration-150 transform hover:scale-110
                        focus:outline-none focus:ring-1 focus:ring-ring
                        ${subtask.completed 
                          ? 'bg-primary border border-primary' 
                          : 'bg-transparent border border-muted-foreground/50'
                        }
                      `}
                    >
                      {subtask.completed && <CheckIcon className="h-2.5 w-2.5 text-primary-foreground" />}
                    </button>
                    <p className={`text-sm flex-grow ${subtask.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {subtask.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskItem

