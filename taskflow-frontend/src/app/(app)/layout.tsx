'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/components/providers/user-provider'
import { Sidebar } from '@/components/layout/sidebar'
import FeatureBar from '@/components/layout/feature-bar'
import BottomNavBar from '@/components/layout/bottom-nav-bar'
import { MenuIcon } from '@/lib/constants'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import { useSettings } from '@/components/providers/settings-provider'
import TaskDetail from '@/components/task/TaskDetail'
import SearchModal from '@/components/search/SearchModal'
import DailyBriefingModal from '@/components/briefing/DailyBriefingModal'
import TaskForm from '@/components/task/TaskForm'
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
  const { state } = useTaskManager()
  const { settings } = useSettings()
  const modal = useModal()
  const [isSidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768
    }
    return false
  })

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !isAuthenticated) {
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
        <header className="md:hidden flex-shrink-0 p-4 border-b border-border flex items-center justify-between z-10 bg-card shadow-sm">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6 text-primary">
              <rect width="256" height="256" fill="none"></rect>
              <path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm45.15,122.34-8.6-14.9a4,4,0,0,0-6.92,0l-22.1,38.28a4,4,0,0,1-3.46,2H92a4,4,0,0,1-3.46-6l25.56-44.28a4,4,0,0,0-3.46-6H65.75a4,4,0,0,1,0-8h42.39a4,4,0,0,1,3.46,6l-25.56,44.28a4,4,0,0,0,3.46,6h22.54a4,4,0,0,1,3.46-2l22.1-38.28a4,4,0,0,0-3.46-6H134.25a4,4,0,0,1,0-8h42.39a4,4,0,0,1,3.46,2l8.6,14.9a4,4,0,0,1-3.46,6H173.15a4,4,0,0,1,0,8h-3.46a4,4,0,0,1-3.46-2Z"></path>
            </svg>
            <h1 className="font-bold text-lg">TaskFlow</h1>
          </div>
          <div></div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex min-w-0 overflow-y-auto">
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
