'use client'

import React from 'react'
import { useI18n } from '@/lib/hooks/use-i18n'
import {
  SearchIcon,
  SparklesIcon,
  UndoIcon,
  RedoIcon,
  TrashIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@/lib/icons'
import { Avatar } from '@/components/ui/avatar'
import type { SortOrder } from '@/lib/utils/task-helpers'

interface TaskListHeaderProps {
  title: string
  listMembers?: Array<{ id: string; name: string; email: string }>
  onSearch?: () => void
  onBriefing?: () => void
  onSortToggle?: () => void
  sortOrder?: SortOrder
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  onClearHistory?: () => void
}

const TaskListHeader: React.FC<TaskListHeaderProps> = ({
  title,
  listMembers = [],
  onSearch,
  onBriefing,
  onSortToggle,
  sortOrder = 'default',
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onClearHistory,
}) => {
  const { t } = useI18n()

  const renderSortIcon = () => {
    if (sortOrder === 'dueDateAsc') return <ArrowUpIcon className="h-5 w-5 text-muted-foreground" />
    if (sortOrder === 'dueDateDesc') return <ArrowDownIcon className="h-5 w-5 text-muted-foreground" />
    return <ArrowsUpDownIcon className="h-5 w-5 text-muted-foreground" />
  }

  return (
    <header className="shrink-0 grid grid-cols-[minmax(0,1fr),auto] md:grid-cols-3 items-center px-4 py-3 md:p-6 border-b border-border gap-2 md:gap-4">
      <div className="flex items-center gap-3 md:gap-4">
        <h1 className="hidden md:block text-lg md:text-2xl font-bold truncate">{title}</h1>
        {listMembers.length > 0 && (
          <div className="flex items-center -space-x-2">
            {listMembers.slice(0, 3).map(member => (
              <Avatar key={member.id} user={member} className="w-7 h-7 border-2 border-background" />
            ))}
            {listMembers.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold border-2 border-background">
                +{listMembers.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="hidden md:flex items-center justify-center md:col-start-2">
        {onBriefing && (
          <button
            type="button"
            onClick={onBriefing}
            className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-md cursor-pointer hover:bg-muted transition-colors"
            aria-label={t('mainContent.dailyBriefing')}
          >
            <SparklesIcon className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {t('mainContent.dailyBriefing')}
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 justify-end col-start-2 md:col-start-3">
        {onSearch && (
          <button
            type="button"
            onClick={onSearch}
            className="p-2 rounded-md hover:bg-secondary transition-colors"
            aria-label={t('mainContent.searchTasks')}
          >
            <SearchIcon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </button>
        )}
        {onSortToggle && (
          <button
            type="button"
            onClick={onSortToggle}
            className="p-2 rounded-md hover:bg-secondary transition-colors"
            aria-label={t('mainContent.sortTasks')}
          >
            {renderSortIcon()}
          </button>
        )}
        <div className="hidden md:flex items-center gap-2">
          {onUndo && (
            <button 
              type="button"
              onClick={onUndo} 
              disabled={!canUndo} 
              className="p-2 rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              aria-label={t('mainContent.undo')}
            >
              <UndoIcon className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          {onRedo && (
            <button 
              type="button"
              onClick={onRedo} 
              disabled={!canRedo} 
              className="p-2 rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              aria-label={t('mainContent.redo')}
            >
              <RedoIcon className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          {onClearHistory && (
            <button
              type="button"
              onClick={onClearHistory}
              disabled={!canUndo && !canRedo}
              className="p-2 rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              aria-label={t('mainContent.clearHistory')}
            >
              <TrashIcon className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default TaskListHeader

