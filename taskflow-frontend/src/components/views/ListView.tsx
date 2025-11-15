'use client'

import React, { useState, useMemo } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import TaskList from '@/components/task/TaskList'
import TaskListHeader from '@/components/task/TaskListHeader'
import { SPECIAL_LISTS_CONFIG } from '@/lib/constants'
import type { SortOrder } from '@/lib/utils/task-helpers'

interface ListViewProps {
  onSearchToggle?: () => void
  onBriefingToggle?: () => void
  onOpenTaskForm?: () => void
}

const ListView: React.FC<ListViewProps> = ({
  onSearchToggle,
  onBriefingToggle,
  onOpenTaskForm,
}) => {
  const { state, dispatch, canUndo, canRedo } = useTaskManager()
  const { t } = useI18n()
  const [sortOrder, setSortOrder] = useState<SortOrder>('default')

  const activeListId = useMemo(() => {
    // Get active list from URL or default to 'inbox'
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      if (path.includes('/list')) {
        // Could parse query params for listId
        return 'inbox'
      }
    }
    return 'inbox'
  }, [])

  const activeList = useMemo(() => {
    if (activeListId in SPECIAL_LISTS_CONFIG || state.activeTag) {
      return null
    }
    return state.lists.find(l => l.id === activeListId)
  }, [activeListId, state.lists, state.activeTag])

  // Mock users for list members
  const mockUsers = [
    { id: 'user-001', name: 'You', email: 'you@example.com' },
    { id: 'user-002', name: 'John Doe', email: 'john@example.com' },
    { id: 'user-003', name: 'Jane Smith', email: 'jane@example.com' },
  ]

  const listMembers = useMemo(() => {
    if (!activeList || !activeList.members) return []
    return activeList.members
      .map(memberId => mockUsers.find(u => u.id === memberId))
      .filter(Boolean) as Array<{ id: string; name: string; email: string }>
  }, [activeList])

  const getActiveListName = () => {
    if (state.activeTag) {
      return `#${state.activeTag}`
    }
    if (activeListId in SPECIAL_LISTS_CONFIG) {
      const configKey = activeListId as keyof typeof SPECIAL_LISTS_CONFIG
      return t(SPECIAL_LISTS_CONFIG[configKey].name) || activeListId
    }
    return activeList ? activeList.name : t('mainContent.tasksDefault') || 'Tasks'
  }

  const handleSortToggle = () => {
    let nextSortOrder: SortOrder
    if (sortOrder === 'default') {
      nextSortOrder = 'dueDateAsc'
    } else if (sortOrder === 'dueDateAsc') {
      nextSortOrder = 'dueDateDesc'
    } else {
      nextSortOrder = 'default'
    }
    setSortOrder(nextSortOrder)
  }

  const handleUndo = () => {
    if (canUndo) {
      dispatch({ type: 'UNDO' })
    }
  }

  const handleRedo = () => {
    if (canRedo) {
      dispatch({ type: 'REDO' })
    }
  }

  const handleClearHistory = () => {
    // TODO: Implement clear history
    console.log('Clear history')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TaskListHeader
        title={getActiveListName()}
        listMembers={listMembers}
        onSearch={onSearchToggle}
        onBriefing={onBriefingToggle}
        onSortToggle={handleSortToggle}
        sortOrder={sortOrder}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearHistory={handleClearHistory}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
        <TaskList
          onAddTask={onOpenTaskForm}
          activeListId={activeListId}
          activeTag={state.activeTag || null}
          sortOrder={sortOrder}
        />
      </main>
    </div>
  )
}

export default ListView

