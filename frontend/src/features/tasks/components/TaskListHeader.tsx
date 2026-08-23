'use client'

import React from 'react'
import { useI18n } from '@/lib/i18n/hooks'
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
import { IconButton } from '@/components/ui/icon-button'
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
    if (sortOrder === 'dueDateAsc') return <ArrowUpIcon className="h-5 w-5" />
    if (sortOrder === 'dueDateDesc') return <ArrowDownIcon className="h-5 w-5" />
    return <ArrowsUpDownIcon className="h-5 w-5" />
  }

  return (
    <header className="shrink-0 border-b border-border px-4 py-4 md:px-6 md:py-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">{title}</h1>
            {listMembers.length > 0 && (
              <div className="flex shrink-0 items-center -space-x-2" aria-label={`${listMembers.length}`}>
                {listMembers.slice(0, 3).map((member) => (
                  <Avatar
                    key={member.id}
                    user={member}
                    className="h-7 w-7 border-2 border-background"
                  />
                ))}
                {listMembers.length > 3 && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-secondary text-xs font-semibold">
                    +{listMembers.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
          {sortOrder !== 'default' && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t('mainContent.sortTasks')}: {sortOrder === 'dueDateAsc' ? '↑' : '↓'}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onBriefing && (
            <button
              type="button"
              onClick={onBriefing}
              className="hidden items-center gap-2 rounded-lg border border-border/60 bg-secondary/70 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
              aria-label={t('mainContent.dailyBriefing')}
            >
              <SparklesIcon className="h-4 w-4 text-primary" />
              <span>{t('mainContent.dailyBriefing')}</span>
            </button>
          )}

          {onSearch && (
            <IconButton
              onClick={onSearch}
              size="lg"
              variant="toolbar"
              aria-label={t('mainContent.searchTasks')}
              title={t('mainContent.searchTasks')}
            >
              <SearchIcon className="h-5 w-5" />
            </IconButton>
          )}

          {onSortToggle && (
            <IconButton
              onClick={onSortToggle}
              size="lg"
              variant="toolbar"
              aria-label={t('mainContent.sortTasks')}
              title={t('mainContent.sortTasks')}
              className={sortOrder !== 'default' ? 'bg-primary/10 text-primary' : undefined}
            >
              {renderSortIcon()}
            </IconButton>
          )}

          <div className="hidden items-center md:flex" title={t('mainContent.historyLocalNote')}>
            {onUndo && (
              <IconButton
                onClick={onUndo}
                disabled={!canUndo}
                size="md"
                variant="toolbar"
                aria-label={t('mainContent.undo')}
                title={t('mainContent.undoTooltip')}
              >
                <UndoIcon className="h-5 w-5" />
              </IconButton>
            )}
            {onRedo && (
              <IconButton
                onClick={onRedo}
                disabled={!canRedo}
                size="md"
                variant="toolbar"
                aria-label={t('mainContent.redo')}
                title={t('mainContent.redoTooltip')}
              >
                <RedoIcon className="h-5 w-5" />
              </IconButton>
            )}
            {onClearHistory && (
              <IconButton
                onClick={onClearHistory}
                disabled={!canUndo && !canRedo}
                size="md"
                variant="toolbar"
                aria-label={t('mainContent.clearHistory')}
                title={t('mainContent.clearHistoryTooltip')}
              >
                <TrashIcon className="h-5 w-5" />
              </IconButton>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TaskListHeader
