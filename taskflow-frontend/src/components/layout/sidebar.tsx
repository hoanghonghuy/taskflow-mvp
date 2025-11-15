'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import { useI18n } from '@/lib/hooks/use-i18n'
import { useUser } from '@/components/providers/user-provider'
import { SPECIAL_LISTS_CONFIG, TAG_COLORS, ListBulletIcon, PlusIcon, TagIcon, TrashIcon, ArrowDownIcon, UserPlusIcon, ChatBubbleLeftRightIcon } from '@/lib/constants'
import Avatar from '@/components/ui/avatar'
import ProfileDropdown from '@/components/auth/profile-dropdown'
import { useRouter } from 'next/navigation'
import { useConfirmation } from '@/components/providers/confirmation-provider'
import { useToast } from '@/components/providers/toast-provider'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onChatbotToggle?: () => void
  onShareList?: (listId: string) => void
}

export function Sidebar({ isOpen, onClose, onChatbotToggle, onShareList }: SidebarProps) {
  const { state, dispatch } = useTaskManager()
  const { t } = useI18n()
  const { user } = useUser()
  const router = useRouter()
  const { confirm } = useConfirmation()
  const addToast = useToast()
  const [newList, setNewList] = useState('')
  const [newTag, setNewTag] = useState('')
  const [isListsExpanded, setIsListsExpanded] = useState(true)
  const [isTagsExpanded, setIsTagsExpanded] = useState(true)
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleAddList = (e: React.FormEvent) => {
    e.preventDefault()
    if (newList.trim()) {
      dispatch({ type: 'ADD_LIST', payload: { name: newList.trim(), color: '#6b7280', members: [] } })
      setNewList('')
    }
  }

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTag.trim()) {
      dispatch({ type: 'ADD_TAG', payload: { name: newTag.trim() } })
      setNewTag('')
    }
  }

  const handleDeleteList = async (listId: string, listName: string) => {
    const isConfirmed = await confirm({
      title: t('sidebar.deleteList.confirm.title', { listName }),
      description: t('sidebar.deleteList.confirm.message'),
      confirmText: t('sidebar.deleteList.confirm.button'),
      variant: 'destructive',
    })

    if (isConfirmed) {
      dispatch({ type: 'DELETE_LIST', payload: listId })
      addToast.success(t('sidebar.deleteList.success', { listName }))
    }
  }

  const handleDeleteTag = async (tagName: string) => {
    const isConfirmed = await confirm({
      title: t('sidebar.deleteTag.confirm.title', { tagName }),
      description: t('sidebar.deleteTag.confirm.message'),
      confirmText: t('sidebar.deleteTag.confirm.button'),
      variant: 'destructive',
    })

    if (isConfirmed) {
      dispatch({ type: 'DELETE_TAG', payload: tagName })
      addToast.success(t('sidebar.deleteTag.success', { tagName }))
    }
  }

  const allTags = useMemo(() => {
    return [...state.tags].sort()
  }, [state.tags])

  const getTagColor = (tag: string) => {
    let hash = 0
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash % TAG_COLORS.length)
    return TAG_COLORS[index]
  }

  const NavItem: React.FC<{
    children: React.ReactNode
    isActive: boolean
    onClick: () => void
  }> = ({ children, isActive, onClick }) => {
    const handleClick = () => {
      onClick()
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        onClose()
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    }

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between text-sm px-3 py-2 rounded-md transition-colors group cursor-pointer ${
          isActive ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/50'
        }`}
      >
        {children}
      </div>
    )
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
      <aside className={`
        fixed md:relative inset-y-0 left-0 bg-card flex flex-col shrink-0 z-30 
        w-64 transition-transform md:transition-all duration-300 ease-in-out overflow-hidden border-border
        ${isOpen 
          ? 'p-4 border-r translate-x-0 md:w-64'
          : 'p-4 -translate-x-full md:w-0 md:p-0 md:border-r-0 md:translate-x-0'
        }
      `}>
        <div className="flex items-center gap-2 mb-6 px-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-8 w-8 text-primary">
            <rect width="256" height="256" fill="none"></rect>
            <path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm45.15,122.34-8.6-14.9a4,4,0,0,0-6.92,0l-22.1,38.28a4,4,0,0,1-3.46,2H92a4,4,0,0,1-3.46-6l25.56-44.28a4,4,0,0,0-3.46-6H65.75a4,4,0,0,1,0-8h42.39a4,4,0,0,1,3.46,6l-25.56,44.28a4,4,0,0,0,3.46,6h22.54a4,4,0,0,1,3.46-2l22.1-38.28a4,4,0,0,0-3.46-6H134.25a4,4,0,0,1,0-8h42.39a4,4,0,0,1,3.46,2l8.6,14.9a4,4,0,0,1-3.46,6H173.15a4,4,0,0,1,0,8h-3.46a4,4,0,0,1-3.46-2Z"></path>
          </svg>
          <h1 className="text-xl font-bold whitespace-nowrap">{t('app.name')}</h1>
        </div>

        <div className="flex-grow overflow-y-auto pr-1 min-w-[15rem]">
          <nav className="space-y-1">
            {Object.values(SPECIAL_LISTS_CONFIG).map(({ id, name, icon: Icon }) => (
              <NavItem
                key={id}
                isActive={state.activeListId === id && !state.activeTag}
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_LIST', payload: id })
                  router.push('/list')
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span>{t(name as any)}</span>
                </div>
              </NavItem>
            ))}
          </nav>

          <div className="pt-4">
            <div className="flex items-center justify-between px-3 mb-2">
                    <h2 className="text-xs font-semibold text-muted-foreground">{t('sidebar.myLists')}</h2>
              <button onClick={() => setIsListsExpanded(!isListsExpanded)} className="p-1 rounded-md hover:bg-muted/50">
                <ArrowDownIcon className={`h-4 w-4 text-muted-foreground transition-transform ${!isListsExpanded && '-rotate-90'}`} />
              </button>
            </div>
            {isListsExpanded && (
              <div className="animate-accordion-down overflow-hidden">
                <div className="space-y-1">
                  {state.lists.map(list => {
                    const taskCount = state.tasks.filter(t => t.listId === list.id && !t.completed).length
                    return (
                      <NavItem
                        key={list.id}
                        isActive={state.activeListId === list.id && !state.activeTag}
                        onClick={() => {
                          dispatch({ type: 'SET_ACTIVE_LIST', payload: list.id })
                          router.push('/list')
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <ListBulletIcon className="h-5 w-5" />
                          <span className="truncate flex-1 text-left">{list.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">{taskCount}</span>
                          {onShareList && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onShareList(list.id); }} 
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary p-0.5 rounded"
                              aria-label={t('sidebar.aria.shareList', { listName: list.name })}
                            >
                              <UserPlusIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id, list.name); }} 
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-0.5 rounded"
                            aria-label={t('sidebar.aria.deleteList', { listName: list.name })}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </NavItem>
                    )
                  })}
                </div>
                <form onSubmit={handleAddList} className="flex items-center gap-2 mt-2 px-3">
                  <PlusIcon className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={newList}
                    onChange={e => setNewList(e.target.value)}
                    placeholder={t('sidebar.addNewList')}
                    className="w-full bg-transparent text-sm placeholder-muted-foreground focus:outline-none"
                  />
                </form>
              </div>
            )}
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between px-3 mb-2">
                    <h2 className="text-xs font-semibold text-muted-foreground">{t('sidebar.tags')}</h2>
              <button onClick={() => setIsTagsExpanded(!isTagsExpanded)} className="p-1 rounded-md hover:bg-muted/50">
                <ArrowDownIcon className={`h-4 w-4 text-muted-foreground transition-transform ${!isTagsExpanded && '-rotate-90'}`} />
              </button>
            </div>
            {isTagsExpanded && (
              <div className="animate-accordion-down overflow-hidden">
                <div className="space-y-1">
                  {allTags.map(tag => {
                    const taskCount = state.tasks.filter(t => t.tags.includes(tag) && !t.completed).length
                    return (
                      <div
                        key={tag}
                        className={`group w-full flex items-center justify-between text-sm px-3 py-2 rounded-md transition-colors ${
                          state.activeTag === tag ? 'bg-primary/10' : 'hover:bg-muted/50'
                        }`}
                      >
                        <button
                          onClick={() => {
                            dispatch({ type: 'SET_ACTIVE_TAG', payload: tag })
                            router.push('/list')
                            if (window.innerWidth < 768) {
                              onClose()
                            }
                          }}
                          className={`flex-grow flex items-center gap-3 text-left ${state.activeTag === tag ? 'text-primary font-semibold' : ''}`}
                        >
                          <TagIcon className="h-5 w-5" />
                          <span className="truncate flex-1">{tag}</span>
                        </button>
                        <div className="flex items-center gap-2 pl-2">
                          <span className="text-xs font-medium text-muted-foreground">{taskCount}</span>
                          <span className={`w-2 h-2 rounded-full ${getTagColor(tag)}`}></span>
                          <button 
                            onClick={() => handleDeleteTag(tag)} 
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-0.5 rounded"
                            aria-label={t('sidebar.aria.deleteTag', { tagName: tag })}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <form onSubmit={handleAddTag} className="flex items-center gap-2 mt-2 px-3">
                  <PlusIcon className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder={t('sidebar.addNewTag')}
                    className="w-full bg-transparent text-sm placeholder-muted-foreground focus:outline-none"
                  />
                </form>
              </div>
            )}
          </div>
        </div>

        {onChatbotToggle && (
          <div className="pt-4">
            <button
              onClick={onChatbotToggle}
              className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-md bg-secondary hover:bg-muted transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    {t('sidebar.chatWithGemini')}
            </button>
          </div>
        )}
        <div ref={profileDropdownRef} className="relative mt-auto pt-4 md:hidden">
          <div className="border-t border-border mb-4 -mx-4"></div>
          <button onClick={() => setProfileDropdownOpen(prev => !prev)} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-secondary">
            <Avatar user={user} className="w-8 h-8" />
            <span className="font-semibold text-sm truncate">{user?.name}</span>
          </button>
          {isProfileDropdownOpen && <ProfileDropdown user={user} onClose={() => setProfileDropdownOpen(false)} />}
        </div>
      </aside>
    </>
  )
}
