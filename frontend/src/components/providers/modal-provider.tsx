'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface ModalContextType {
  isSearchOpen: boolean
  isBriefingOpen: boolean
  isChatbotOpen: boolean
  taskForm: { isOpen: boolean; defaultValues?: { listId?: string; columnId?: string } }
  shareListModal: { isOpen: boolean; listId: string | null }
  openSearch: () => void
  closeSearch: () => void
  openBriefing: () => void
  closeBriefing: () => void
  openChatbot: () => void
  closeChatbot: () => void
  openTaskForm: (defaultValues?: { listId?: string; columnId?: string }) => void
  closeTaskForm: () => void
  openShareList: (listId: string) => void
  closeShareList: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setSearchOpen] = useState(false)
  const [isBriefingOpen, setBriefingOpen] = useState(false)
  const [isChatbotOpen, setChatbotOpen] = useState(false)
  const [taskForm, setTaskForm] = useState<{ isOpen: boolean; defaultValues?: { listId?: string; columnId?: string } }>({ isOpen: false })
  const [shareListModal, setShareListModal] = useState<{ isOpen: boolean; listId: string | null }>({ isOpen: false, listId: null })

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])
  const openBriefing = useCallback(() => setBriefingOpen(true), [])
  const closeBriefing = useCallback(() => setBriefingOpen(false), [])
  const openChatbot = useCallback(() => setChatbotOpen(true), [])
  const closeChatbot = useCallback(() => setChatbotOpen(false), [])
  const openTaskForm = useCallback((defaultValues?: { listId?: string; columnId?: string }) => {
    setTaskForm({ isOpen: true, defaultValues })
  }, [])
  const closeTaskForm = useCallback(() => {
    setTaskForm({ isOpen: false })
  }, [])
  const openShareList = useCallback((listId: string) => {
    setShareListModal({ isOpen: true, listId })
  }, [])
  const closeShareList = useCallback(() => {
    setShareListModal({ isOpen: false, listId: null })
  }, [])

  return (
    <ModalContext.Provider
      value={{
        isSearchOpen,
        isBriefingOpen,
        isChatbotOpen,
        taskForm,
        shareListModal,
        openSearch,
        closeSearch,
        openBriefing,
        closeBriefing,
        openChatbot,
        closeChatbot,
        openTaskForm,
        closeTaskForm,
        openShareList,
        closeShareList,
      }}
    >
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

