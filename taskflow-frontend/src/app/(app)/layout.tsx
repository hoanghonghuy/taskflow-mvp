"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/components/providers/user-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import { Sidebar } from '@/components/layout/sidebar'
import FeatureBar from '@/components/layout/feature-bar'
import BottomNavBar from '@/components/layout/bottom-nav-bar'
import { MenuIcon, SPECIAL_LISTS_CONFIG } from '@/lib/constants'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import TaskDetail from '@/features/tasks/components/TaskDetail'
import SearchModal from '@/features/search/components/SearchModal'
import DailyBriefingModal from '@/components/briefing/DailyBriefingModal'
import TaskForm from '@/features/tasks/components/TaskForm'
import ShareListModal from '@/components/collaboration/ShareListModal'
import Chatbot from '@/components/chatbot/Chatbot'
import { useModal } from '@/components/providers/modal-provider'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated } = useUser()
  const { t } = useI18n()
  const { state } = useTaskManager()
  const modal = useModal()
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768
    }
    return false
  })

  const mobileTitle = (() => {
    const path = pathname || '/'

    if (path === '/' || path.startsWith('/dashboard')) {
      return t('nav.dashboard')
    }

    if (path.startsWith('/list')) {
      if (state.activeTag) {
        return `#${state.activeTag}`
      }

      if (state.activeListId in SPECIAL_LISTS_CONFIG) {
        const configKey = state.activeListId as keyof typeof SPECIAL_LISTS_CONFIG
        return t(SPECIAL_LISTS_CONFIG[configKey].name)
      }

      const activeList = state.lists.find(l => l.id === state.activeListId)
      return activeList ? activeList.name : t('mainContent.tasksDefault')
    }

    if (path.startsWith('/board')) {
      return t('nav.board')
    }

    if (path.startsWith('/calendar')) {
      return t('nav.calendar')
    }

    if (path.startsWith('/matrix')) {
      return t('nav.matrix')
    }

    if (path.startsWith('/habits')) {
      return t('nav.habits')
    }

    if (path.startsWith('/pomodoro')) {
      return t('nav.pomodoro')
    }

    if (path.startsWith('/countdown')) {
      return t('nav.countdown')
    }

    if (path.startsWith('/achievements')) {
      return t('nav.achievements')
    }

    if (path.startsWith('/profile')) {
      return t('nav.profile')
    }

    if (path.startsWith('/settings')) {
      return t('nav.settings')
    }

    return ''
  })()

  const isClient = typeof window !== 'undefined'

  useEffect(() => {
    if (!isClient) return
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isClient, isAuthenticated, router])

  // Theme is handled by SettingsProvider

  // Show loading state during hydration to prevent mismatch
  if (!isClient || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <FeatureBar onSidebarToggle={() => setSidebarOpen(prev => !prev)} />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onChatbotToggle={modal.openChatbot}
        onShareList={modal.openShareList}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden shrink-0 p-4 border-b border-border flex items-center justify-between z-10 bg-card shadow-sm">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="flex-1 flex justify-center px-2">
            {mobileTitle && (
              <h1 className="text-sm font-semibold truncate">
                {mobileTitle}
              </h1>
            )}
          </div>
          <div className="w-6" />
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex min-w-0 overflow-hidden">
            {children}
          </div>
          {/* TaskDetail panel */}
          <div className={`
            fixed inset-0 z-20 md:relative md:z-auto md:inset-auto transition-transform duration-300 ease-in-out bg-card
            ${state.selectedTaskId ? 'translate-x-0' : 'translate-x-full'}
          `}>
            {state.selectedTaskId && <TaskDetail taskId={state.selectedTaskId} />}
          </div>
        </div>
      </div>

      <BottomNavBar />
      
      {/* Modals */}
      {modal.isSearchOpen && <SearchModal onClose={modal.closeSearch} />}
      {modal.isBriefingOpen && <DailyBriefingModal onClose={modal.closeBriefing} />}
      {modal.isChatbotOpen && <Chatbot onClose={modal.closeChatbot} />}
      {modal.taskForm.isOpen && <TaskForm onClose={modal.closeTaskForm} defaultValues={modal.taskForm.defaultValues} />}
      {modal.shareListModal.isOpen && (() => {
        const listToShare = state.lists.find(l => l.id === modal.shareListModal.listId)
        return listToShare ? (
          <ShareListModal 
            list={listToShare} 
            onClose={modal.closeShareList} 
          />
        ) : null
      })()}
    </div>
  )
}
