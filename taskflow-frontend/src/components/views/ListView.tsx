'use client'

import React, { useMemo } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useUser } from '@/components/providers/user-provider'
import { useModal } from '@/components/providers/modal-provider'
import TaskList from '@/components/task/TaskList'
import TaskListHeader from '@/components/task/TaskListHeader'
import { SPECIAL_LISTS_CONFIG, PlusIcon } from '@/lib/constants'
import type { SortOrder } from '@/lib/utils/task-helpers'

const ListView: React.FC = () => {
  const { state, dispatch, canUndo, canRedo } = useTaskManager()
  const { t } = useI18n()
  const { allUsers } = useUser()
  const { openSearch, openBriefing, openTaskForm } = useModal()

  const activeList = useMemo(() => {
    if (state.activeListId in SPECIAL_LISTS_CONFIG || state.activeTag) {
      return null
    }
    return state.lists.find(l => l.id === state.activeListId)
  }, [state.activeListId, state.lists, state.activeTag])

  const listMembers = useMemo(() => {
    if (!activeList || !activeList.members) return []
    return activeList.members
      .map(memberId => allUsers.find(u => u.id === memberId))
      .filter(Boolean) as typeof allUsers
  }, [activeList, allUsers])

  const getActiveListName = () => {
    if (state.activeTag) {
      return `#${state.activeTag}`
    }
    if (state.activeListId in SPECIAL_LISTS_CONFIG) {
      const configKey = state.activeListId as keyof typeof SPECIAL_LISTS_CONFIG
      return t(SPECIAL_LISTS_CONFIG[configKey].name)
    }
    return activeList ? activeList.name : t('mainContent.tasksDefault')
  }

  const handleSortToggle = () => {
    let nextSortOrder: SortOrder
    if (state.sortOrder === 'default') {
      nextSortOrder = 'dueDateAsc'
    } else if (state.sortOrder === 'dueDateAsc') {
      nextSortOrder = 'dueDateDesc'
    } else {
      nextSortOrder = 'default'
    }
    dispatch({ type: 'SET_SORT_ORDER', payload: nextSortOrder })
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
    if (canUndo || canRedo) {
      dispatch({ type: 'CLEAR_HISTORY' })
    }
  }

  return (
    <main className="flex-1 flex flex-col">
      <TaskListHeader
        title={getActiveListName()}
        listMembers={listMembers}
        onSearch={openSearch}
        onBriefing={openBriefing}
        onSortToggle={handleSortToggle}
        sortOrder={state.sortOrder}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearHistory={handleClearHistory}
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
        <TaskList onAddTask={openTaskForm} />
      </div>

      <button
        onClick={() => openTaskForm()}
        className="fixed md:absolute bottom-20 md:bottom-8 right-4 md:right-8 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform hover:scale-105 z-10"
        aria-label={t('taskList.addTask')}
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </main>
  )
}

export default ListView

