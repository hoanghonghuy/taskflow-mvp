"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/components/providers/user-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { Sidebar } from '@/components/layout/sidebar'
import FeatureBar from '@/components/layout/feature-bar'
import BottomNavBar from '@/components/layout/bottom-nav-bar'
import { MenuIcon } from '@/lib/icons'
import { SPECIAL_LISTS_CONFIG } from '@/lib/task-constants'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import TaskDetail from '@/features/tasks/components/TaskDetail'
import SearchModal from '@/features/search/components/SearchModal'
import DailyBriefingModal from '@/components/briefing/DailyBriefingModal'
import TaskForm from '@/features/tasks/components/TaskForm'
import ShareListModal from '@/components/collaboration/ShareListModal'
import Chatbot from '@/components/chatbot/Chatbot'
import { useModal } from '@/components/providers/modal-provider'
import { AI_FEATURES_ENABLED } from '@/lib/feature-flags'
import { AppLoadingSkeleton } from '@/components/layout/app-loading-skeleton'
import { resolvePageSkeletonVariant } from '@/components/layout/page-skeleton'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, authReady } = useUser()
  const { dispatch, hydrationError, isHydrating, retryHydration, state } = useTaskManager()
  const { t } = useI18n()
  const modal = useModal()
  // Closed by default; open only on large desktop (≥1024) after mount to avoid tablet dual-chrome + hydration flash.
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [renderedTaskDetailId, setRenderedTaskDetailId] = useState<string | null>(null)
  const [isTaskDetailVisible, setTaskDetailVisible] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setSidebarOpen(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (state.selectedTaskId) {
      setRenderedTaskDetailId(state.selectedTaskId)
      const frame = window.requestAnimationFrame(() => {
        setTaskDetailVisible(true)
      })
      return () => window.cancelAnimationFrame(frame)
    }

    if (!renderedTaskDetailId) {
      setTaskDetailVisible(false)
      return
    }

    setTaskDetailVisible(false)
    const timeout = window.setTimeout(() => {
      setRenderedTaskDetailId(null)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [renderedTaskDetailId, state.selectedTaskId])

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

  useEffect(() => {
    if (authReady && !isAuthenticated) {
      router.replace('/login')
    }
  }, [authReady, isAuthenticated, router])

  const handleCloseTaskDetail = () => {
    dispatch({ type: 'SET_SELECTED_TASK', payload: null })
  }

  // Theme is handled by SettingsProvider

  if (authReady && isAuthenticated && hydrationError && !isHydrating) {
    return (
      <div
        role="alert"
        className="flex h-dvh items-center justify-center bg-background p-4 text-foreground"
      >
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-semibold">{t('common.errorTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('common.errorBody')}</p>
          <button
            type="button"
            onClick={retryHydration}
            className="mt-6 min-h-11 rounded-lg bg-primary px-4 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      </div>
    )
  }

  if (!authReady || !isAuthenticated || isHydrating) {
    return <AppLoadingSkeleton variant={resolvePageSkeletonVariant(pathname)} />
  }

  return (
    <div
      data-testid="app-shell"
      className="flex h-dvh bg-background text-foreground overflow-hidden"
    >
      <FeatureBar onSidebarToggle={() => setSidebarOpen(prev => !prev)} />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onChatbotToggle={AI_FEATURES_ENABLED ? modal.openChatbot : undefined}
        onShareList={modal.openShareList}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden shrink-0 p-4 border-b border-border flex items-center justify-between z-10 bg-card shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="cursor-pointer rounded-md p-2 transition-colors hover:bg-muted/50"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-center px-2 [&:has(#mobile-header-actions:not(:empty))>h1]:hidden">
            {mobileTitle && (
              <h1 className="text-sm font-semibold truncate">
                {mobileTitle}
              </h1>
            )}
            <div
              id="mobile-header-actions"
              className="flex min-w-0 flex-1 items-center justify-center empty:hidden"
            />
          </div>
          <div className="w-6" />
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex min-w-0 overflow-hidden">
            {children}
          </div>
          {renderedTaskDetailId && (
            <div
              className={`fixed inset-0 z-40 flex justify-end ${isTaskDetailVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  handleCloseTaskDetail()
                }
              }}
            >
              <div
                className={`relative h-full w-full transition-transform duration-300 ease-in-out motion-reduce:transition-none md:max-w-xl ${
                  isTaskDetailVisible ? 'translate-x-0' : 'translate-x-full'
                }`}
              >
                <TaskDetail taskId={renderedTaskDetailId} />
              </div>
            </div>
          )}
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
