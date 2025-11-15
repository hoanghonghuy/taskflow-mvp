'use client'

import React, { useState } from 'react'
import { useTaskManager } from '@/components/providers/task-manager-provider'
import { useUser } from '@/components/providers/user-provider'
import { useI18n } from '@/lib/hooks/use-i18n'
import type { List } from '@/types'
import { CloseIcon, PlusIcon, TrashIcon } from '@/lib/constants'
import { Avatar } from '@/components/ui/avatar'

interface ShareListModalProps {
  list: List
  onClose: () => void
}

const ShareListModal: React.FC<ShareListModalProps> = ({ list, onClose }) => {
  const { dispatch } = useTaskManager()
  const { t } = useI18n()
  const { allUsers, user: currentUser } = useUser()
  const [memberIds, setMemberIds] = useState<string[]>(list.members || [])
  
  const handleAddMember = (userId: string) => {
    if (!memberIds.includes(userId)) {
      setMemberIds([...memberIds, userId])
    }
  }
  
  const handleRemoveMember = (userId: string) => {
    // Prevent removing the current user (owner)
    if (userId === currentUser?.id) return
    setMemberIds(memberIds.filter(id => id !== userId))
  }
  
  const handleSave = () => {
    dispatch({ type: 'UPDATE_LIST_MEMBERS', payload: { listId: list.id, memberIds } })
    onClose()
  }

  const potentialMembers = allUsers.filter(u => !memberIds.includes(u.id))

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
        <header className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {t('shareList.title', { listName: list.name }) || `Share "${list.name}"`}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('shareList.subtitle') || 'Manage who can access this list.'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
            <CloseIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {t('shareList.members') || 'Members'}
          </h3>
          <div className="space-y-3">
            {memberIds.map(id => {
              const member = allUsers.find(u => u.id === id)
              if (!member) return null
              return (
                <div key={id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar user={member} className="w-8 h-8" />
                    <div>
                      <p className="font-semibold text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  {member.id !== currentUser?.id ? (
                    <button 
                      onClick={() => handleRemoveMember(id)} 
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      aria-label={t('sidebar.aria.deleteList', { listName: member.name }) || `Remove ${member.name}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground pr-2">
                      {t('shareList.owner') || 'Owner'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t('shareList.invite') || 'Invite others'}
            </h3>
            {potentialMembers.length > 0 ? (
              <div className="space-y-2">
                {potentialMembers.map(user => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-2 rounded-md hover:bg-secondary"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar user={user} className="w-8 h-8" />
                      <div>
                        <p className="font-semibold text-sm">{user.name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAddMember(user.id)} 
                      className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary"
                      aria-label={t('shareList.invite') || `Add ${user.name}`}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                {t('shareList.empty') || 'Everyone is already in this list.'}
              </p>
            )}
          </div>
        </div>

        <footer className="p-4 bg-secondary/50 rounded-b-lg flex justify-end">
          <button 
            onClick={handleSave} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90"
          >
            {t('shareList.done') || 'Done'}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default ShareListModal

