'use client'

import React, { useState, useMemo } from 'react'
import { useTaskManager } from '@/lib/hooks/use-task-manager'
import { useListActions, useTaskActions } from '@/components/providers/task-manager-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { useUser } from '@/components/providers/user-provider'
import { SPECIAL_LISTS_CONFIG, TAG_COLORS } from '@/lib/task-constants'
import { ListBulletIcon, PlusIcon, TagIcon, TrashIcon, ArrowDownIcon, UserPlusIcon, ChatBubbleLeftRightIcon } from '@/lib/icons'
import Avatar from '@/components/ui/avatar'
import ProfileDropdown from '@/components/auth/profile-dropdown'
import { ListEditDialog } from '@/components/layout/list-edit-dialog'
import { useRouter } from 'next/navigation'
import { useConfirmation } from '@/components/providers/confirmation-provider'
import { useToast } from '@/components/providers/toast-provider'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { IconButton } from '@/components/ui/icon-button'
import type { List } from '@/types'
import { isOwnedList } from '@/lib/utils/list-access'

function isInboxList(list: Pick<List, 'id' | 'name'>): boolean {
  return list.id === 'inbox' || list.name === 'Inbox'
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onChatbotToggle?: () => void
  onShareList?: (listId: string) => void
}

export function Sidebar({ isOpen, onClose, onChatbotToggle, onShareList }: SidebarProps) {
  const { state, dispatch } = useTaskManager()
  const { addList, deleteList } = useListActions()
  const { deleteTag } = useTaskActions()
  const { t } = useI18n()
  const { user } = useUser()
  const router = useRouter()
  const { confirm } = useConfirmation()
  const addToast = useToast()
  const [newList, setNewList] = useState('')
  const [newTag, setNewTag] = useState('')
  const [isListsExpanded, setIsListsExpanded] = useState(true)
  const [isTagsExpanded, setIsTagsExpanded] = useState(true)
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<List | null>(null)

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newList.trim()
    if (!name) return

    try {
      const created = await addList({ name, color: '#6b7280', members: [] })
      if (created) {
        addToast.success(t('sidebar.addList.success', { listName: name }))
        setNewList('')
      }
    } catch (error) {
      console.error('Failed to add list via useListActions', error)
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
      const deleted = await deleteList(listId)
      if (deleted) {
        addToast.success(t('sidebar.deleteList.success', { listName }))
      }
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
      const deleted = await deleteTag(tagName)
      if (deleted) {
        addToast.success(t('sidebar.deleteTag.success', { tagName }))
      }
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
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        onClose()
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.target !== e.currentTarget) return
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
          isActive
            ? 'bg-muted text-foreground font-medium'
            : 'text-foreground/90 hover:bg-muted/50'
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
        role="button"
        tabIndex={isOpen ? 0 : -1}
        aria-label="Close menu"
        aria-hidden={!isOpen}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClose()
          }
        }}
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      ></div>
      <aside
        inert={!isOpen}
        aria-hidden={!isOpen}
        className={`
        fixed md:relative inset-y-0 left-0 bg-card flex flex-col shrink-0 z-50
        w-64 transition-transform md:transition-all duration-300 ease-in-out overflow-hidden border-border
        ${isOpen 
          ? 'p-4 border-r translate-x-0 md:w-64'
          : 'p-4 -translate-x-full md:w-0 md:p-0 md:border-r-0 md:translate-x-0'
        }
      `}
      >
        <div className="flex items-center gap-3 mb-6 px-2 justify-start md:justify-between">
          <div className="hidden md:flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-8 w-8 text-primary">
              <rect width="256" height="256" fill="none"></rect>
              <path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm45.15,122.34-8.6-14.9a4,4,0,0,0-6.92,0l-22.1,38.28a4,4,0,0,1-3.46,2H92a4,4,0,0,1-3.46-6l25.56-44.28a4,4,0,0,0-3.46-6H65.75a4,4,0,0,1,0-8h42.39a4,4,0,0,1,3.46,6l-25.56,44.28a4,4,0,0,0,3.46,6h22.54a4,4,0,0,1,3.46-2l22.1-38.28a4,4,0,0,0-3.46-6H134.25a4,4,0,0,1,0-8h42.39a4,4,0,0,1,3.46,2l8.6,14.9a4,4,0,0,1-3.46,6H173.15a4,4,0,0,1,0,8h-3.46a4,4,0,0,1-3.46-2Z"></path>
            </svg>
            <h1 className="text-xl font-bold whitespace-nowrap">{t('app.name')}</h1>
          </div>
          <Dialog open={isProfileDialogOpen} onOpenChange={setProfileDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card md:hidden"
              >
                <Avatar user={user} className="w-9 h-9" />
                <span className="text-sm font-semibold truncate max-w-28">{user?.name || t('profile.viewProfile')}</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader className="sr-only">
                <DialogTitle>{t('profile.viewProfile')}</DialogTitle>
                <DialogDescription>{t('sidebar.profileDialogDescription')}</DialogDescription>
              </DialogHeader>
              <ProfileDropdown
                user={user}
                onClose={() => setProfileDialogOpen(false)}
                variant="modal"
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grow overflow-y-auto pr-1 min-w-60">
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
                  <span>{t(name)}</span>
                </div>
              </NavItem>
            ))}
          </nav>

          <div className="pt-4">
            <div className="flex items-center justify-between px-3 mb-2">
                    <h2 className="text-xs font-semibold text-muted-foreground">{t('sidebar.myLists')}</h2>
              <button onClick={() => setIsListsExpanded(!isListsExpanded)} className="flex size-11 items-center justify-center rounded-md hover:bg-muted/50 md:size-auto md:p-1">
                <ArrowDownIcon className={`h-4 w-4 text-muted-foreground transition-transform ${!isListsExpanded && '-rotate-90'}`} />
              </button>
            </div>
            {isListsExpanded && (
              <div className="animate-accordion-down overflow-hidden">
                <div className="space-y-1">
                  {state.lists.map(list => {
                    const taskCount = state.tasks.filter(t => t.listId === list.id && !t.completed).length
                    const canManageList = isOwnedList(list, user?.id)
                    const showActions = canManageList && !isInboxList(list)
                    return (
                      <NavItem
                        key={list.id}
                        isActive={state.activeListId === list.id && !state.activeTag}
                        onClick={() => {
                          dispatch({ type: 'SET_ACTIVE_LIST', payload: list.id })
                          router.push('/list')
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: list.color || '#6b7280' }}
                            aria-hidden="true"
                          />
                          <ListBulletIcon className="h-5 w-5 shrink-0" />
                          <span className="truncate text-left">{list.name}</span>
                        </div>
                        <div className="ml-2 flex shrink-0 items-center">
                          <div
                            className={`flex min-w-16 items-center justify-end gap-0.5 md:w-16 ${
                              showActions
                                ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                                : 'pointer-events-none opacity-0'
                            }`}
                          >
                            {showActions && (
                              <>
                                <IconButton
                                  size="sm"
                                  className="size-11 p-2 hover:text-primary md:size-auto md:p-0.5"
                                  onClick={(e) => { e.stopPropagation(); setEditingList(list) }}
                                  aria-label={t('sidebar.aria.editList', { listName: list.name })}
                                >
                                  <span className="text-xs font-semibold">✎</span>
                                </IconButton>
                                {onShareList && (
                                  <IconButton
                                    size="sm"
                                    className="size-11 p-2 hover:text-primary md:size-auto md:p-0.5"
                                    onClick={(e) => { e.stopPropagation(); onShareList(list.id); }}
                                    aria-label={t('sidebar.aria.shareList', { listName: list.name })}
                                  >
                                    <UserPlusIcon className="h-4 w-4" />
                                  </IconButton>
                                )}
                                <IconButton
                                  size="sm"
                                  variant="destructive"
                                  className="size-11 p-2 md:size-auto md:p-0.5"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id, list.name); }}
                                  aria-label={t('sidebar.aria.deleteList', { listName: list.name })}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </IconButton>
                              </>
                            )}
                          </div>
                          <span className="w-5 text-right text-xs font-medium tabular-nums text-muted-foreground">
                            {taskCount}
                          </span>
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
              <button onClick={() => setIsTagsExpanded(!isTagsExpanded)} className="flex size-11 items-center justify-center rounded-md hover:bg-muted/50 md:size-auto md:p-1">
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
                          state.activeTag === tag ? 'bg-muted' : 'hover:bg-muted/50'
                        }`}
                      >
                        <button
                          onClick={() => {
                            dispatch({ type: 'SET_ACTIVE_TAG', payload: tag })
                            router.push('/list')
                            if (window.innerWidth < 1024) {
                              onClose()
                            }
                          }}
                          className={`grow flex items-center gap-3 text-left ${state.activeTag === tag ? 'font-medium text-foreground' : ''}`}
                        >
                          <TagIcon className="h-5 w-5" />
                          <span className="truncate flex-1">{tag}</span>
                        </button>
                        <div className="flex items-center gap-2 pl-2">
                          <span className="text-xs font-medium text-muted-foreground">{taskCount}</span>
                          <span className={`w-2 h-2 rounded-full ${getTagColor(tag)}`}></span>
                          <IconButton
                            size="sm"
                            variant="destructive"
                            className="size-11 p-2 opacity-100 md:size-auto md:p-0.5 md:opacity-0 md:group-hover:opacity-100"
                            onClick={() => handleDeleteTag(tag)}
                            aria-label={t('sidebar.aria.deleteTag', { tagName: tag })}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
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
          <div className="mt-auto pt-4 pb-4">
            <button
              onClick={onChatbotToggle}
              className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-md bg-secondary hover:bg-muted transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    {t('sidebar.chatWithGemini')}
            </button>
          </div>
        )}
      </aside>
      <ListEditDialog
        list={editingList}
        open={editingList !== null}
        onOpenChange={(open) => { if (!open) setEditingList(null) }}
      />
    </>
  )
}
