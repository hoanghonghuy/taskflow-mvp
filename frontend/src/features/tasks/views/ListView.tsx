'use client'

import React, { useMemo } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { useUser } from '@/components/providers/user-provider'
import { useModal } from '@/components/providers/modal-provider'
import TaskList from '@/features/tasks/components/TaskList'
import TaskListHeader from '@/features/tasks/components/TaskListHeader'
import { SPECIAL_LISTS_CONFIG } from '@/lib/task-constants'
import { PlusIcon } from '@/lib/icons'
import type { SortOrder } from '@/lib/utils/task-helpers'
import { AppPage, AppPageContainer, AppPageMain } from '@/components/layout/app-page'

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
    <AppPage>
      <AppPageContainer>
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
      </AppPageContainer>
      <AppPageMain className="py-4 md:py-6">
        <TaskList onAddTask={openTaskForm} />
      </AppPageMain>

      <button
        onClick={() => openTaskForm()}
        className="fixed md:absolute bottom-20 md:bottom-8 right-4 md:right-8 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform hover:scale-105 z-10"
        aria-label={t('taskList.addTask')}
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </AppPage>
  )
}

export default ListView

